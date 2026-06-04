/**
 * Convites atleta ↔ treinador (P2) + vínculo por código em conta existente.
 */

import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

const ATHLETE_STATUS_ACTIVE = "Ativo";
const ATHLETE_STATUS_UNLINKED = "Desvinculado";

function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Documento na lista do treinador — reativa após convite/código (remove soft-delete). */
function coachemAthleteLinkPatch(
  coachId: string,
  athleteUid: string,
  displayName: string,
  now: admin.firestore.FieldValue
): Record<string, unknown> {
  return {
    coachId,
    name: displayName,
    status: ATHLETE_STATUS_ACTIVE,
    authUid: athleteUid,
    deletedAt: admin.firestore.FieldValue.delete(),
    updatedAt: now,
    createdAt: now,
  };
}

/** Garante doc canónico + espelhos legados (outro id com mesmo authUid). */
async function reconcileCoachemAthletesOnLink(
  athleteUid: string,
  coachId: string,
  displayName: string,
  now: admin.firestore.FieldValue
): Promise<void> {
  const patch = coachemAthleteLinkPatch(coachId, athleteUid, displayName, now);
  await db.collection("coachemAthletes").doc(athleteUid).set(patch, { merge: true });

  const legacy = await db
    .collection("coachemAthletes")
    .where("authUid", "==", athleteUid)
    .get();
  if (legacy.empty) return;

  const batch = db.batch();
  let hasLegacy = false;
  for (const docSnap of legacy.docs) {
    if (docSnap.id === athleteUid) continue;
    batch.set(docSnap.ref, patch, { merge: true });
    hasLegacy = true;
  }
  if (hasLegacy) await batch.commit();
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

/** Treinador convida email (pending até atleta aceitar). */
export const sendCoachInviteToAthlete = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É preciso estar logado.");
  }
  const coachId = request.auth.uid;
  const raw = (request.data || {}) as { email?: string };
  const email =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Email inválido.");
  }

  const coachSnap = await db.collection("users").doc(coachId).get();
  if (!coachSnap.exists || coachSnap.data()?.userType !== "COACH") {
    throw new HttpsError("permission-denied", "Apenas treinadores podem convidar.");
  }

  const inviteId = `${coachId}_${email.replace(/[^a-z0-9@._-]/g, "_")}`;
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection("coachInvites").doc(inviteId).set(
    {
      coachId,
      athleteEmail: email,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  return { ok: true, inviteId };
});

/** Atleta logado aceita convite pendente pelo id do documento. */
export const acceptCoachInvite = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É preciso estar logado.");
  }
  const athleteUid = request.auth.uid;
  const raw = (request.data || {}) as { inviteId?: string };
  const inviteId = typeof raw.inviteId === "string" ? raw.inviteId.trim() : "";
  if (!inviteId) {
    throw new HttpsError("invalid-argument", "Convite inválido.");
  }

  const athleteSnap = await db.collection("users").doc(athleteUid).get();
  if (!athleteSnap.exists || athleteSnap.data()?.userType !== "ATHLETE") {
    throw new HttpsError("permission-denied", "Apenas atletas podem aceitar.");
  }

  const inviteRef = db.collection("coachInvites").doc(inviteId);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) {
    throw new HttpsError("not-found", "Convite não encontrado.");
  }
  const invite = inviteSnap.data()!;
  if (invite.status !== "pending") {
    throw new HttpsError("failed-precondition", "Este convite já foi utilizado.");
  }

  const athleteEmail = (athleteSnap.data()?.email as string | undefined)?.toLowerCase();
  const inviteEmail = (invite.athleteEmail as string | undefined)?.toLowerCase();
  if (athleteEmail && inviteEmail && athleteEmail !== inviteEmail) {
    throw new HttpsError(
      "permission-denied",
      "Este convite foi enviado para outro email."
    );
  }

  const coachId = invite.coachId as string;
  const displayName =
    typeof athleteSnap.data()?.displayName === "string"
      ? athleteSnap.data()!.displayName
      : "Atleta";
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    tx.update(inviteRef, { status: "accepted", updatedAt: now });
    tx.set(
      db.collection("users").doc(athleteUid),
      {
        athleteMode: "coached",
        coachId,
        coachUnlinkedAt: admin.firestore.FieldValue.delete(),
        coachAccessEndsAt: admin.firestore.FieldValue.delete(),
        coachUnlinkedFromCoachId: admin.firestore.FieldValue.delete(),
        updatedAt: now,
      },
      { merge: true }
    );
    tx.set(
      db.collection("coachemAthletes").doc(athleteUid),
      coachemAthleteLinkPatch(coachId, athleteUid, displayName, now),
      { merge: true }
    );
  });

  await reconcileCoachemAthletesOnLink(athleteUid, coachId, displayName, now);

  return { ok: true, coachId };
});

/** Atleta já com coach em users mas ausente na lista (ex.: deletedAt antigo) — repara coachemAthletes. */
export const syncCoachemAthleteWithUserLink = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const athleteUid = request.auth.uid;
    const athleteSnap = await db.collection("users").doc(athleteUid).get();
    if (!athleteSnap.exists || athleteSnap.data()?.userType !== "ATHLETE") {
      throw new HttpsError("permission-denied", "Apenas atletas.");
    }
    const coachId = athleteSnap.data()?.coachId as string | undefined;
    if (!coachId || typeof coachId !== "string") {
      throw new HttpsError("failed-precondition", "Sem treinador vinculado.");
    }
    const displayName =
      typeof athleteSnap.data()?.displayName === "string"
        ? athleteSnap.data()!.displayName
        : "Atleta";
    const now = admin.firestore.FieldValue.serverTimestamp();
    await reconcileCoachemAthletesOnLink(athleteUid, coachId, displayName, now);
    return { ok: true, coachId };
  }
);

/** Atleta solo (ou sem coach) liga treinador por código após já ter conta. */
export const linkAthleteToCoachByCode = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É preciso estar logado.");
  }
  const athleteUid = request.auth.uid;
  const raw = (request.data || {}) as { code?: string };
  const code = typeof raw.code === "string" ? normalizeInviteCode(raw.code) : "";
  if (!code) {
    throw new HttpsError("invalid-argument", "Informe o código do treinador.");
  }

  const athleteSnap = await db.collection("users").doc(athleteUid).get();
  if (!athleteSnap.exists || athleteSnap.data()?.userType !== "ATHLETE") {
    throw new HttpsError("permission-denied", "Apenas atletas podem vincular treinador.");
  }
  if (athleteSnap.data()?.coachId) {
    throw new HttpsError(
      "failed-precondition",
      "Já tens um treinador vinculado. Desvincula primeiro no Perfil."
    );
  }

  const coach = await findCoachByInviteCode(code);
  if (!coach) {
    throw new HttpsError("not-found", "Código não encontrado.");
  }

  const displayName =
    typeof athleteSnap.data()?.displayName === "string"
      ? athleteSnap.data()!.displayName
      : "Atleta";
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    tx.set(
      db.collection("users").doc(athleteUid),
      {
        athleteMode: "coached",
        coachId: coach.coachId,
        coachUnlinkedAt: admin.firestore.FieldValue.delete(),
        coachAccessEndsAt: admin.firestore.FieldValue.delete(),
        coachUnlinkedFromCoachId: admin.firestore.FieldValue.delete(),
        updatedAt: now,
      },
      { merge: true }
    );
    tx.set(
      db.collection("coachemAthletes").doc(athleteUid),
      coachemAthleteLinkPatch(coach.coachId, athleteUid, displayName, now),
      { merge: true }
    );
  });

  await reconcileCoachemAthletesOnLink(
    athleteUid,
    coach.coachId,
    displayName,
    now
  );

  return { ok: true, coachDisplayName: coach.displayName, coachId: coach.coachId };
});

async function applyCoachAthleteUnlink(athleteUid: string, coachId: string): Promise<string> {
  const athleteRef = db.collection("users").doc(athleteUid);
  const athleteSnap = await athleteRef.get();
  if (!athleteSnap.exists || athleteSnap.data()?.userType !== "ATHLETE") {
    throw new HttpsError("failed-precondition", "Perfil de atleta não encontrado.");
  }

  const linkedCoachId = athleteSnap.data()?.coachId as string | undefined;
  if (!linkedCoachId || linkedCoachId !== coachId) {
    throw new HttpsError(
      "failed-precondition",
      "Este atleta já não está vinculado a ti."
    );
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + 30);

  await db.runTransaction(async (tx) => {
    tx.set(
      athleteRef,
      {
        athleteMode: "solo",
        coachId: admin.firestore.FieldValue.delete(),
        coachUnlinkedAt: now,
        coachAccessEndsAt: admin.firestore.Timestamp.fromDate(graceEnd),
        coachUnlinkedFromCoachId: coachId,
        updatedAt: now,
      },
      { merge: true }
    );
    tx.set(
      db.collection("coachemAthletes").doc(athleteUid),
      { status: ATHLETE_STATUS_UNLINKED, coachId, updatedAt: now },
      { merge: true }
    );
  });

  return graceEnd.toISOString();
}

/** Atleta coached desvincula do treinador → solo + 30 dias de graça nos pendentes do ex-coach. */
export const unlinkAthleteFromCoach = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É preciso estar logado.");
  }
  const athleteUid = request.auth.uid;
  const athleteSnap = await db.collection("users").doc(athleteUid).get();
  if (!athleteSnap.exists || athleteSnap.data()?.userType !== "ATHLETE") {
    throw new HttpsError("permission-denied", "Apenas atletas podem desvincular.");
  }

  const coachId = athleteSnap.data()?.coachId as string | undefined;
  if (!coachId || typeof coachId !== "string") {
    throw new HttpsError("failed-precondition", "Não tens treinador vinculado.");
  }

  const coachAccessEndsAt = await applyCoachAthleteUnlink(athleteUid, coachId);
  return { ok: true, coachAccessEndsAt };
});

/** Treinador desvincula atleta (mantém histórico; status Desvinculado na lista). */
export const detachAthleteFromCoachByCoach = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É preciso estar logado.");
  }
  const coachId = request.auth.uid;
  const raw = (request.data || {}) as { athleteId?: string };
  const athleteId = typeof raw.athleteId === "string" ? raw.athleteId.trim() : "";
  if (!athleteId) {
    throw new HttpsError("invalid-argument", "Informe o atleta.");
  }

  const coachSnap = await db.collection("users").doc(coachId).get();
  if (!coachSnap.exists || coachSnap.data()?.userType !== "COACH") {
    throw new HttpsError("permission-denied", "Apenas treinadores podem desvincular atletas.");
  }

  const athleteDoc = await db.collection("coachemAthletes").doc(athleteId).get();
  if (!athleteDoc.exists || athleteDoc.data()?.coachId !== coachId) {
    throw new HttpsError("permission-denied", "Este atleta não pertence à tua lista.");
  }

  const coachAccessEndsAt = await applyCoachAthleteUnlink(athleteId, coachId);
  return { ok: true, coachAccessEndsAt };
});
