"use strict";
/**
 * Webhook HTTPS RevenueCat → Firestore `users/{app_user_id}`
 *
 * Deploy: garantir Secret Manager REVENUECAT_WEBHOOK_AUTHORIZATION (valor = Bearer definido na RC).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.revenueCatWebhook = void 0;
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const REVENUECAT_WEBHOOK_AUTH_SECRET = (0, params_1.defineSecret)("REVENUECAT_WEBHOOK_AUTHORIZATION");
/** Igual ao dashboard RevenueCat (entitlement) e ao app. */
const ENTITLEMENT_PRO = "pro";
function bodyEvent(payload) {
    const ev = payload.event;
    if (ev && typeof ev === "object" && ev !== null)
        return ev;
    return payload;
}
function hasProEntitlement(e) {
    const ids = e.entitlement_ids;
    return Array.isArray(ids) && ids.includes(ENTITLEMENT_PRO);
}
async function coachUserExists(uid) {
    var _a;
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists)
        return false;
    const ut = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.userType;
    return ut === "COACH";
}
async function setPro(uid, expirationMs, meta) {
    var _a, _b;
    await db.collection("users").doc(uid).set({
        subscriptionTier: "pro",
        subscriptionExpiresAt: admin.firestore.Timestamp.fromMillis(expirationMs),
        revenueCatSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        revenueCatLastEventType: (_a = meta.type) !== null && _a !== void 0 ? _a : null,
        revenueCatEnvironment: (_b = meta.environment) !== null && _b !== void 0 ? _b : null,
        revenueCatWebhookUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function setFree(uid, meta) {
    var _a, _b;
    await db.collection("users").doc(uid).set({
        subscriptionTier: "free",
        subscriptionExpiresAt: admin.firestore.FieldValue.delete(),
        revenueCatSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        revenueCatLastEventType: (_a = meta.type) !== null && _a !== void 0 ? _a : null,
        revenueCatEnvironment: (_b = meta.environment) !== null && _b !== void 0 ? _b : null,
        revenueCatWebhookUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function applyEvent(uid, e) {
    var _a, _b;
    const type = (_a = e.type) !== null && _a !== void 0 ? _a : "";
    const meta = { type, environment: (_b = e.environment) !== null && _b !== void 0 ? _b : undefined };
    if (type === "TEST")
        return;
    if (type === "TRANSFER") {
        const from = Array.isArray(e.transferred_from) ? e.transferred_from : [];
        const to = Array.isArray(e.transferred_to) ? e.transferred_to : [];
        for (const fid of from) {
            if (typeof fid === "string" && fid.trim() && (await coachUserExists(fid.trim()))) {
                await setFree(fid.trim(), { ...meta, type: "TRANSFER(from)" });
            }
        }
        const expMs = typeof e.expiration_at_ms === "number" ? e.expiration_at_ms : null;
        if (hasProEntitlement(e) && expMs !== null && expMs > Date.now()) {
            for (const tid of to) {
                if (typeof tid === "string" && tid.trim() && (await coachUserExists(tid.trim()))) {
                    await setPro(tid.trim(), expMs, meta);
                }
            }
        }
        return;
    }
    if (!(await coachUserExists(uid))) {
        console.warn(`revenueCatWebhook: utilizador ignorado (${uid.substring(0, 8)}…) — não é treinador Coach'em`);
        return;
    }
    if (type === "EXPIRATION") {
        if (hasProEntitlement(e))
            await setFree(uid, meta);
        return;
    }
    const expMs = typeof e.expiration_at_ms === "number" ? e.expiration_at_ms : null;
    if (hasProEntitlement(e) && expMs !== null && expMs > Date.now()) {
        await setPro(uid, expMs, meta);
        return;
    }
    if (hasProEntitlement(e) && expMs !== null && expMs <= Date.now()) {
        await setFree(uid, meta);
    }
    /*
     * entitlement `pro` no payload mas sem expiration_at_ms: não atualizar Firestore
     * para não sobrescrever dados incoerentes; RC costuma incluir expiry em retries.
     */
}
exports.revenueCatWebhook = (0, https_1.onRequest)({
    region: "us-central1",
    secrets: [REVENUECAT_WEBHOOK_AUTH_SECRET],
    cors: false,
    timeoutSeconds: 60,
    memory: "256MiB",
    invoker: "public",
}, async (req, res) => {
    var _a, _b, _c;
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const configuredToken = (_a = REVENUECAT_WEBHOOK_AUTH_SECRET.value()) === null || _a === void 0 ? void 0 : _a.trim();
    if (!configuredToken) {
        console.error("revenueCatWebhook: secret REVENUECAT_WEBHOOK_AUTHORIZATION não definido");
        res.status(503).send("Server misconfiguration");
        return;
    }
    const authRaw = (_b = req.get("authorization")) === null || _b === void 0 ? void 0 : _b.trim();
    const tokenReceived = (authRaw === null || authRaw === void 0 ? void 0 : authRaw.startsWith("Bearer "))
        ? authRaw.slice(7).trim()
        : authRaw !== null && authRaw !== void 0 ? authRaw : "";
    /** Igual ao valor do cabeçalho Authorization na configuração do Webhook na RevenueCat (com ou sem prefixo Bearer). */
    if (!tokenReceived || tokenReceived !== configuredToken) {
        res.status(401).send("Unauthorized");
        return;
    }
    const payload = typeof req.body === "object" && req.body !== null ? req.body : {};
    let eventPayload;
    try {
        eventPayload = bodyEvent(payload);
    }
    catch (_d) {
        res.status(400).send("Invalid JSON payload");
        return;
    }
    const type = (_c = eventPayload.type) !== null && _c !== void 0 ? _c : "UNKNOWN";
    try {
        if (type === "TRANSFER") {
            await applyEvent("", eventPayload);
            res.status(200).json({ received: true });
            return;
        }
        const rawUid = typeof eventPayload.app_user_id === "string" ? eventPayload.app_user_id.trim() : "";
        if (!rawUid) {
            console.warn("revenueCatWebhook: payload sem app_user_id", type);
            res.status(200).json({ received: true, skipped: true });
            return;
        }
        await applyEvent(rawUid, eventPayload);
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error("revenueCatWebhook:", err);
        res.status(500).send("Internal error");
    }
});
