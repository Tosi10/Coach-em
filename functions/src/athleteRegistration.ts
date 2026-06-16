/**
 * Cadastro de atleta (solo / com código do treinador) — P1 atleta solo.
 * O atleta não pode criar coachemAthletes pelas rules; a Function faz isso quando coached.
 */

import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { getPasswordStrengthErrorMessage } from "./passwordValidation";

const db = admin.firestore();
const auth = admin.auth();

const RATE_LIMIT_COLLECTION = "_treinaRateLimits";
const HOUR_MS = 60 * 60 * 1000;

function hourBucket(): number {
  return Math.floor(Date.now() / HOUR_MS);
}

function rateDocId(action: string, identity: string): string {
  const h = crypto
    .createHash("sha256")
    .update(`${action}|${identity}`)
    .digest("hex")
    .slice(0, 40);
  return `${action}_${h}_${hourBucket()}`;
}

function getClientIp(request: CallableRequest): string {
  const raw = request.rawRequest;
  if (!raw?.headers) return "unknown";
  const xff = raw.headers["x-forwarded-for"];
  const first = Array.isArray(xff) ? xff[0] : xff;
  if (typeof first === "string" && first.trim()) {
    return first.split(",")[0].trim().slice(0, 64);
  }
  return "unknown";
}

async function consumeRate(action: string, identity: string, max: number): Promise<void> {
  const docId = rateDocId(action, identity);
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(docId);
  await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const next = (snap.data()?.count as number | undefined) ?? 0;
    if (next + 1 > max) {
      throw new HttpsError(
        "resource-exhausted",
        "Muitas tentativas. Aguarde cerca de uma hora e tente novamente."
      );
    }
    t.set(
      ref,
      {
        count: next + 1,
        action,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

async function findCoachByInviteCode(code: string): Promise<{
  coachId: string;
  displayName: string;
} | null> {
  const snap = await db
    .collection("users")
    .where("inviteCode", "==", code)
    .where("userType", "==", "COACH")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  return {
    coachId: doc.id,
    displayName: typeof data.displayName === "string" ? data.displayName : "Treinador",
  };
}

/** Valida código do treinador (sem login). */
export const validateCoachInviteCode = onCall(
  { region: "us-central1" },
  async (request) => {
    const raw = (request.data || {}) as { code?: string };
    const code =
      typeof raw.code === "string" ? normalizeInviteCode(raw.code) : "";
    if (!code || code.length < 6) {
      throw new HttpsError("invalid-argument", "Informe um código válido.");
    }

    await consumeRate("validateCoachCode", `ip:${getClientIp(request)}`, 60);

    const coach = await findCoachByInviteCode(code);
    if (!coach) {
      return { valid: false as const };
    }
    return {
      valid: true as const,
      coachDisplayName: coach.displayName,
    };
  }
);

interface RegisterAthleteSelfData {
  email?: string;
  password?: string;
  displayName?: string;
  athleteMode?: string;
  coachInviteCode?: string;
  sport?: string;
}

/** Cria conta Auth + users; se coached, também coachemAthletes. Email de confirmação: app chama sendEmailVerificationTreina. */
export const registerAthleteSelf = onCall(
  { region: "us-central1" },
  async (request) => {
    const data = (request.data || {}) as RegisterAthleteSelfData;
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    const displayName =
      typeof data.displayName === "string" ? data.displayName.trim() : "";
    const athleteMode = data.athleteMode === "coached" ? "coached" : "solo";
    const coachInviteCode =
      typeof data.coachInviteCode === "string"
        ? normalizeInviteCode(data.coachInviteCode)
        : "";

    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Email inválido.");
    }
    if (!password) {
      throw new HttpsError("invalid-argument", "Senha é obrigatória.");
    }
    const passwordError = getPasswordStrengthErrorMessage(password);
    if (passwordError) {
      throw new HttpsError("invalid-argument", passwordError);
    }
    if (!displayName) {
      throw new HttpsError("invalid-argument", "Nome é obrigatório.");
    }
    if (athleteMode === "coached" && !coachInviteCode) {
      throw new HttpsError(
        "invalid-argument",
        "Informe o código do seu treinador."
      );
    }

    await consumeRate("registerAthleteSelf", `ip:${getClientIp(request)}`, 15);

    let coachId: string | null = null;
    if (athleteMode === "coached") {
      const coach = await findCoachByInviteCode(coachInviteCode);
      if (!coach) {
        throw new HttpsError(
          "not-found",
          "Código do treinador não encontrado. Confira com seu treinador."
        );
      }
      coachId = coach.coachId;
    }

    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-exists") || msg.includes("already in use")) {
        throw new HttpsError(
          "already-exists",
          "Este email já está cadastrado. Faça login ou use outro email."
        );
      }
      throw new HttpsError("internal", `Erro ao criar conta: ${msg}`);
    }

    const uid = userRecord.uid;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const userDoc: Record<string, unknown> = {
      email,
      displayName,
      userType: "ATHLETE",
      athleteMode,
      createdAt: now,
      updatedAt: now,
    };
    if (coachId) {
      userDoc.coachId = coachId;
    }
    if (typeof data.sport === "string" && data.sport.trim()) {
      userDoc.sport = data.sport.trim();
    }

    try {
      await db.runTransaction(async (tx) => {
        tx.set(db.collection("users").doc(uid), userDoc);
        if (coachId) {
          tx.set(db.collection("coachemAthletes").doc(uid), {
            coachId,
            name: displayName,
            sport: userDoc.sport ?? null,
            status: "Ativo",
            authUid: uid,
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    } catch (err: unknown) {
      try {
        await auth.deleteUser(uid);
      } catch {
        /* ignore */
      }
      const msg = err instanceof Error ? err.message : String(err);
      throw new HttpsError("internal", `Erro ao salvar perfil: ${msg}`);
    }

    return { ok: true, athleteMode, coachId, email };
  }
);
