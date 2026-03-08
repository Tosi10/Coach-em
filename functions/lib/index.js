"use strict";
/**
 * Cloud Functions – Coach'em
 *
 * createAthleteByCoach: o treinador (autenticado) cria a conta do atleta
 * (Firebase Auth + Firestore users + coachemAthletes) para o atleta poder fazer login.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAthleteByCoach = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
/**
 * Só o treinador pode chamar. Cria o usuário no Auth, documento em users e em coachemAthletes.
 * O atleta poderá fazer login com email e temporaryPassword.
 * athleteId = uid do Auth (usado em coachemAssignedWorkouts).
 *
 * Firebase Functions v2: callable recebe um único parâmetro request com request.data e request.auth.
 */
exports.createAthleteByCoach = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const coachId = request.auth.uid;
    const data = (request.data || {});
    const { displayName, email, temporaryPassword, sport } = data;
    if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
        throw new functions.https.HttpsError("invalid-argument", "Nome do atleta é obrigatório.");
    }
    if (!email || typeof email !== "string" || !email.trim()) {
        throw new functions.https.HttpsError("invalid-argument", "Email do atleta é obrigatório.");
    }
    if (!temporaryPassword || typeof temporaryPassword !== "string" || temporaryPassword.length < 6) {
        throw new functions.https.HttpsError("invalid-argument", "A senha provisória deve ter no mínimo 6 caracteres.");
    }
    const coachRef = db.collection("users").doc(coachId);
    const coachSnap = await coachRef.get();
    if (!coachSnap.exists) {
        throw new functions.https.HttpsError("failed-precondition", "Perfil do treinador não encontrado.");
    }
    const coachData = coachSnap.data();
    if ((coachData === null || coachData === void 0 ? void 0 : coachData.userType) !== "COACH") {
        throw new functions.https.HttpsError("permission-denied", "Apenas treinadores podem cadastrar atletas com login.");
    }
    const name = displayName.trim();
    const emailTrim = email.trim().toLowerCase();
    let userRecord;
    try {
        userRecord = await auth.createUser({
            email: emailTrim,
            password: temporaryPassword,
            displayName: name,
            emailVerified: false,
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("email-already-exists") || msg.includes("already in use")) {
            throw new functions.https.HttpsError("already-exists", "Já existe uma conta com este email.");
        }
        throw new functions.https.HttpsError("internal", `Erro ao criar conta: ${msg}`);
    }
    const uid = userRecord.uid;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const userDoc = {
        email: emailTrim,
        displayName: name,
        userType: "ATHLETE",
        coachId,
        sport: (sport === null || sport === void 0 ? void 0 : sport.trim()) || null,
        createdAt: now,
        updatedAt: now,
    };
    const athleteDoc = {
        coachId,
        name,
        sport: (sport === null || sport === void 0 ? void 0 : sport.trim()) || null,
        status: "Ativo",
        authUid: uid,
        createdAt: now,
        updatedAt: now,
    };
    await db.runTransaction(async (tx) => {
        tx.set(db.collection("users").doc(uid), userDoc);
        tx.set(db.collection("coachemAthletes").doc(uid), athleteDoc);
    });
    return { athleteId: uid };
});
