"use strict";
/**
 * Convites atleta ↔ treinador (P2) + vínculo por código em conta existente.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detachAthleteFromCoachByCoach = exports.unlinkAthleteFromCoach = exports.linkAthleteToCoachByCode = exports.syncCoachemAthleteWithUserLink = exports.acceptCoachInvite = exports.sendCoachInviteToAthlete = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();
const ATHLETE_STATUS_ACTIVE = "Ativo";
const ATHLETE_STATUS_UNLINKED = "Desvinculado";
function normalizeInviteCode(raw) {
    return raw.trim().toUpperCase().replace(/\s+/g, "");
}
/** Documento na lista do treinador — reativa após convite/código (remove soft-delete). */
function coachemAthleteLinkPatch(coachId, athleteUid, displayName, now) {
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
async function reconcileCoachemAthletesOnLink(athleteUid, coachId, displayName, now) {
    const patch = coachemAthleteLinkPatch(coachId, athleteUid, displayName, now);
    await db.collection("coachemAthletes").doc(athleteUid).set(patch, { merge: true });
    const legacy = await db
        .collection("coachemAthletes")
        .where("authUid", "==", athleteUid)
        .get();
    if (legacy.empty)
        return;
    const batch = db.batch();
    let hasLegacy = false;
    for (const docSnap of legacy.docs) {
        if (docSnap.id === athleteUid)
            continue;
        batch.set(docSnap.ref, patch, { merge: true });
        hasLegacy = true;
    }
    if (hasLegacy)
        await batch.commit();
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
/** Treinador convida email (pending até atleta aceitar). */
exports.sendCoachInviteToAthlete = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const coachId = request.auth.uid;
    const raw = (request.data || {});
    const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
        throw new https_1.HttpsError("invalid-argument", "Email inválido.");
    }
    const coachSnap = await db.collection("users").doc(coachId).get();
    if (!coachSnap.exists || ((_a = coachSnap.data()) === null || _a === void 0 ? void 0 : _a.userType) !== "COACH") {
        throw new https_1.HttpsError("permission-denied", "Apenas treinadores podem convidar.");
    }
    const inviteId = `${coachId}_${email.replace(/[^a-z0-9@._-]/g, "_")}`;
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("coachInvites").doc(inviteId).set({
        coachId,
        athleteEmail: email,
        status: "pending",
        createdAt: now,
        updatedAt: now,
    }, { merge: true });
    return { ok: true, inviteId };
});
/** Atleta logado aceita convite pendente pelo id do documento. */
exports.acceptCoachInvite = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const athleteUid = request.auth.uid;
    const raw = (request.data || {});
    const inviteId = typeof raw.inviteId === "string" ? raw.inviteId.trim() : "";
    if (!inviteId) {
        throw new https_1.HttpsError("invalid-argument", "Convite inválido.");
    }
    const athleteSnap = await db.collection("users").doc(athleteUid).get();
    if (!athleteSnap.exists || ((_a = athleteSnap.data()) === null || _a === void 0 ? void 0 : _a.userType) !== "ATHLETE") {
        throw new https_1.HttpsError("permission-denied", "Apenas atletas podem aceitar.");
    }
    const inviteRef = db.collection("coachInvites").doc(inviteId);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
        throw new https_1.HttpsError("not-found", "Convite não encontrado.");
    }
    const invite = inviteSnap.data();
    if (invite.status !== "pending") {
        throw new https_1.HttpsError("failed-precondition", "Este convite já foi utilizado.");
    }
    const athleteEmail = (_c = (_b = athleteSnap.data()) === null || _b === void 0 ? void 0 : _b.email) === null || _c === void 0 ? void 0 : _c.toLowerCase();
    const inviteEmail = (_d = invite.athleteEmail) === null || _d === void 0 ? void 0 : _d.toLowerCase();
    if (athleteEmail && inviteEmail && athleteEmail !== inviteEmail) {
        throw new https_1.HttpsError("permission-denied", "Este convite foi enviado para outro email.");
    }
    const coachId = invite.coachId;
    const displayName = typeof ((_e = athleteSnap.data()) === null || _e === void 0 ? void 0 : _e.displayName) === "string"
        ? athleteSnap.data().displayName
        : "Atleta";
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
        tx.update(inviteRef, { status: "accepted", updatedAt: now });
        tx.set(db.collection("users").doc(athleteUid), {
            athleteMode: "coached",
            coachId,
            coachUnlinkedAt: admin.firestore.FieldValue.delete(),
            coachAccessEndsAt: admin.firestore.FieldValue.delete(),
            coachUnlinkedFromCoachId: admin.firestore.FieldValue.delete(),
            updatedAt: now,
        }, { merge: true });
        tx.set(db.collection("coachemAthletes").doc(athleteUid), coachemAthleteLinkPatch(coachId, athleteUid, displayName, now), { merge: true });
    });
    await reconcileCoachemAthletesOnLink(athleteUid, coachId, displayName, now);
    return { ok: true, coachId };
});
/** Atleta já com coach em users mas ausente na lista (ex.: deletedAt antigo) — repara coachemAthletes. */
exports.syncCoachemAthleteWithUserLink = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    var _a, _b, _c;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const athleteUid = request.auth.uid;
    const athleteSnap = await db.collection("users").doc(athleteUid).get();
    if (!athleteSnap.exists || ((_a = athleteSnap.data()) === null || _a === void 0 ? void 0 : _a.userType) !== "ATHLETE") {
        throw new https_1.HttpsError("permission-denied", "Apenas atletas.");
    }
    const coachId = (_b = athleteSnap.data()) === null || _b === void 0 ? void 0 : _b.coachId;
    if (!coachId || typeof coachId !== "string") {
        throw new https_1.HttpsError("failed-precondition", "Sem treinador vinculado.");
    }
    const displayName = typeof ((_c = athleteSnap.data()) === null || _c === void 0 ? void 0 : _c.displayName) === "string"
        ? athleteSnap.data().displayName
        : "Atleta";
    const now = admin.firestore.FieldValue.serverTimestamp();
    await reconcileCoachemAthletesOnLink(athleteUid, coachId, displayName, now);
    return { ok: true, coachId };
});
/** Atleta solo (ou sem coach) liga treinador por código após já ter conta. */
exports.linkAthleteToCoachByCode = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    var _a, _b, _c;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const athleteUid = request.auth.uid;
    const raw = (request.data || {});
    const code = typeof raw.code === "string" ? normalizeInviteCode(raw.code) : "";
    if (!code) {
        throw new https_1.HttpsError("invalid-argument", "Informe o código do treinador.");
    }
    const athleteSnap = await db.collection("users").doc(athleteUid).get();
    if (!athleteSnap.exists || ((_a = athleteSnap.data()) === null || _a === void 0 ? void 0 : _a.userType) !== "ATHLETE") {
        throw new https_1.HttpsError("permission-denied", "Apenas atletas podem vincular treinador.");
    }
    if ((_b = athleteSnap.data()) === null || _b === void 0 ? void 0 : _b.coachId) {
        throw new https_1.HttpsError("failed-precondition", "Já tens um treinador vinculado. Desvincula primeiro no Perfil.");
    }
    const coach = await findCoachByInviteCode(code);
    if (!coach) {
        throw new https_1.HttpsError("not-found", "Código não encontrado.");
    }
    const displayName = typeof ((_c = athleteSnap.data()) === null || _c === void 0 ? void 0 : _c.displayName) === "string"
        ? athleteSnap.data().displayName
        : "Atleta";
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
        tx.set(db.collection("users").doc(athleteUid), {
            athleteMode: "coached",
            coachId: coach.coachId,
            coachUnlinkedAt: admin.firestore.FieldValue.delete(),
            coachAccessEndsAt: admin.firestore.FieldValue.delete(),
            coachUnlinkedFromCoachId: admin.firestore.FieldValue.delete(),
            updatedAt: now,
        }, { merge: true });
        tx.set(db.collection("coachemAthletes").doc(athleteUid), coachemAthleteLinkPatch(coach.coachId, athleteUid, displayName, now), { merge: true });
    });
    await reconcileCoachemAthletesOnLink(athleteUid, coach.coachId, displayName, now);
    return { ok: true, coachDisplayName: coach.displayName, coachId: coach.coachId };
});
async function applyCoachAthleteUnlink(athleteUid, coachId) {
    var _a, _b;
    const athleteRef = db.collection("users").doc(athleteUid);
    const athleteSnap = await athleteRef.get();
    if (!athleteSnap.exists || ((_a = athleteSnap.data()) === null || _a === void 0 ? void 0 : _a.userType) !== "ATHLETE") {
        throw new https_1.HttpsError("failed-precondition", "Perfil de atleta não encontrado.");
    }
    const linkedCoachId = (_b = athleteSnap.data()) === null || _b === void 0 ? void 0 : _b.coachId;
    if (!linkedCoachId || linkedCoachId !== coachId) {
        throw new https_1.HttpsError("failed-precondition", "Este atleta já não está vinculado a ti.");
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + 30);
    await db.runTransaction(async (tx) => {
        tx.set(athleteRef, {
            athleteMode: "solo",
            coachId: admin.firestore.FieldValue.delete(),
            coachUnlinkedAt: now,
            coachAccessEndsAt: admin.firestore.Timestamp.fromDate(graceEnd),
            coachUnlinkedFromCoachId: coachId,
            updatedAt: now,
        }, { merge: true });
        tx.set(db.collection("coachemAthletes").doc(athleteUid), { status: ATHLETE_STATUS_UNLINKED, coachId, updatedAt: now }, { merge: true });
    });
    return graceEnd.toISOString();
}
/** Atleta coached desvincula do treinador → solo + 30 dias de graça nos pendentes do ex-coach. */
exports.unlinkAthleteFromCoach = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const athleteUid = request.auth.uid;
    const athleteSnap = await db.collection("users").doc(athleteUid).get();
    if (!athleteSnap.exists || ((_a = athleteSnap.data()) === null || _a === void 0 ? void 0 : _a.userType) !== "ATHLETE") {
        throw new https_1.HttpsError("permission-denied", "Apenas atletas podem desvincular.");
    }
    const coachId = (_b = athleteSnap.data()) === null || _b === void 0 ? void 0 : _b.coachId;
    if (!coachId || typeof coachId !== "string") {
        throw new https_1.HttpsError("failed-precondition", "Não tens treinador vinculado.");
    }
    const coachAccessEndsAt = await applyCoachAthleteUnlink(athleteUid, coachId);
    return { ok: true, coachAccessEndsAt };
});
/** Treinador desvincula atleta (mantém histórico; status Desvinculado na lista). */
exports.detachAthleteFromCoachByCoach = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const coachId = request.auth.uid;
    const raw = (request.data || {});
    const athleteId = typeof raw.athleteId === "string" ? raw.athleteId.trim() : "";
    if (!athleteId) {
        throw new https_1.HttpsError("invalid-argument", "Informe o atleta.");
    }
    const coachSnap = await db.collection("users").doc(coachId).get();
    if (!coachSnap.exists || ((_a = coachSnap.data()) === null || _a === void 0 ? void 0 : _a.userType) !== "COACH") {
        throw new https_1.HttpsError("permission-denied", "Apenas treinadores podem desvincular atletas.");
    }
    const athleteDoc = await db.collection("coachemAthletes").doc(athleteId).get();
    if (!athleteDoc.exists || ((_b = athleteDoc.data()) === null || _b === void 0 ? void 0 : _b.coachId) !== coachId) {
        throw new https_1.HttpsError("permission-denied", "Este atleta não pertence à tua lista.");
    }
    const coachAccessEndsAt = await applyCoachAthleteUnlink(athleteId, coachId);
    return { ok: true, coachAccessEndsAt };
});
