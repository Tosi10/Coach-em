"use strict";
/**
 * Cadastro de atleta (solo / com código do treinador) — P1 atleta solo.
 * O atleta não pode criar coachemAthletes pelas rules; a Function faz isso quando coached.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAthleteSelf = exports.validateCoachInviteCode = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const db = admin.firestore();
const auth = admin.auth();
const RATE_LIMIT_COLLECTION = "_treinaRateLimits";
const HOUR_MS = 60 * 60 * 1000;
function hourBucket() {
    return Math.floor(Date.now() / HOUR_MS);
}
function rateDocId(action, identity) {
    const h = crypto
        .createHash("sha256")
        .update(`${action}|${identity}`)
        .digest("hex")
        .slice(0, 40);
    return `${action}_${h}_${hourBucket()}`;
}
function getClientIp(request) {
    const raw = request.rawRequest;
    if (!(raw === null || raw === void 0 ? void 0 : raw.headers))
        return "unknown";
    const xff = raw.headers["x-forwarded-for"];
    const first = Array.isArray(xff) ? xff[0] : xff;
    if (typeof first === "string" && first.trim()) {
        return first.split(",")[0].trim().slice(0, 64);
    }
    return "unknown";
}
async function consumeRate(action, identity, max) {
    const docId = rateDocId(action, identity);
    const ref = db.collection(RATE_LIMIT_COLLECTION).doc(docId);
    await db.runTransaction(async (t) => {
        var _a, _b;
        const snap = await t.get(ref);
        const next = (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0;
        if (next + 1 > max) {
            throw new https_1.HttpsError("resource-exhausted", "Muitas tentativas. Aguarde cerca de uma hora e tente novamente.");
        }
        t.set(ref, {
            count: next + 1,
            action,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
function normalizeInviteCode(raw) {
    return raw.trim().toUpperCase().replace(/\s+/g, "");
}
async function findCoachByInviteCode(code) {
    const snap = await db
        .collection("users")
        .where("inviteCode", "==", code)
        .where("userType", "==", "COACH")
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    const doc = snap.docs[0];
    const data = doc.data();
    return {
        coachId: doc.id,
        displayName: typeof data.displayName === "string" ? data.displayName : "Treinador",
    };
}
/** Valida código do treinador (sem login). */
exports.validateCoachInviteCode = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    const raw = (request.data || {});
    const code = typeof raw.code === "string" ? normalizeInviteCode(raw.code) : "";
    if (!code || code.length < 6) {
        throw new https_1.HttpsError("invalid-argument", "Informe um código válido.");
    }
    await consumeRate("validateCoachCode", `ip:${getClientIp(request)}`, 60);
    const coach = await findCoachByInviteCode(code);
    if (!coach) {
        return { valid: false };
    }
    return {
        valid: true,
        coachDisplayName: coach.displayName,
    };
});
/** Cria conta Auth + users; se coached, também coachemAthletes. Email de confirmação: app chama sendEmailVerificationTreina. */
exports.registerAthleteSelf = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    const data = (request.data || {});
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    const displayName = typeof data.displayName === "string" ? data.displayName.trim() : "";
    const athleteMode = data.athleteMode === "coached" ? "coached" : "solo";
    const coachInviteCode = typeof data.coachInviteCode === "string"
        ? normalizeInviteCode(data.coachInviteCode)
        : "";
    if (!email || !email.includes("@")) {
        throw new https_1.HttpsError("invalid-argument", "Email inválido.");
    }
    if (!password || password.length < 6) {
        throw new https_1.HttpsError("invalid-argument", "A senha deve ter no mínimo 6 caracteres.");
    }
    if (!displayName) {
        throw new https_1.HttpsError("invalid-argument", "Nome é obrigatório.");
    }
    if (athleteMode === "coached" && !coachInviteCode) {
        throw new https_1.HttpsError("invalid-argument", "Informe o código do seu treinador.");
    }
    await consumeRate("registerAthleteSelf", `ip:${getClientIp(request)}`, 15);
    let coachId = null;
    if (athleteMode === "coached") {
        const coach = await findCoachByInviteCode(coachInviteCode);
        if (!coach) {
            throw new https_1.HttpsError("not-found", "Código do treinador não encontrado. Confira com seu treinador.");
        }
        coachId = coach.coachId;
    }
    let userRecord;
    try {
        userRecord = await auth.createUser({
            email,
            password,
            displayName,
            emailVerified: false,
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("email-already-exists") || msg.includes("already in use")) {
            throw new https_1.HttpsError("already-exists", "Este email já está cadastrado. Faça login ou use outro email.");
        }
        throw new https_1.HttpsError("internal", `Erro ao criar conta: ${msg}`);
    }
    const uid = userRecord.uid;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const userDoc = {
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
            var _a;
            tx.set(db.collection("users").doc(uid), userDoc);
            if (coachId) {
                tx.set(db.collection("coachemAthletes").doc(uid), {
                    coachId,
                    name: displayName,
                    sport: (_a = userDoc.sport) !== null && _a !== void 0 ? _a : null,
                    status: "Ativo",
                    authUid: uid,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        });
    }
    catch (err) {
        try {
            await auth.deleteUser(uid);
        }
        catch (_a) {
            /* ignore */
        }
        const msg = err instanceof Error ? err.message : String(err);
        throw new https_1.HttpsError("internal", `Erro ao salvar perfil: ${msg}`);
    }
    return { ok: true, athleteMode, coachId, email };
});
