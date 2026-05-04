/**
 * Webhook HTTPS RevenueCat → Firestore `users/{app_user_id}`
 *
 * Deploy: garantir Secret Manager REVENUECAT_WEBHOOK_AUTHORIZATION (valor = Bearer definido na RC).
 */

import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const REVENUECAT_WEBHOOK_AUTH_SECRET = defineSecret("REVENUECAT_WEBHOOK_AUTHORIZATION");

/** Igual ao dashboard RevenueCat (entitlement) e ao app. */
const ENTITLEMENT_PRO = "pro";

type RcEvent = {
  type?: string;
  app_user_id?: string | null;
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  environment?: string | null;
  transferred_from?: string[] | null;
  transferred_to?: string[] | null;
};

function bodyEvent(payload: Record<string, unknown>): RcEvent {
  const ev = payload.event;
  if (ev && typeof ev === "object" && ev !== null) return ev as RcEvent;
  return payload as RcEvent;
}

function hasProEntitlement(e: RcEvent): boolean {
  const ids = e.entitlement_ids;
  return Array.isArray(ids) && ids.includes(ENTITLEMENT_PRO);
}

async function coachUserExists(uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return false;
  const ut = snap.data()?.userType;
  return ut === "COACH";
}

async function setPro(uid: string, expirationMs: number, meta: Record<string, unknown>): Promise<void> {
  await db.collection("users").doc(uid).set(
    {
      subscriptionTier: "pro",
      subscriptionExpiresAt: admin.firestore.Timestamp.fromMillis(expirationMs),
      revenueCatSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      revenueCatLastEventType: meta.type ?? null,
      revenueCatEnvironment: meta.environment ?? null,
      revenueCatWebhookUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function setFree(uid: string, meta: Record<string, unknown>): Promise<void> {
  await db.collection("users").doc(uid).set(
    {
      subscriptionTier: "free",
      subscriptionExpiresAt: admin.firestore.FieldValue.delete(),
      revenueCatSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      revenueCatLastEventType: meta.type ?? null,
      revenueCatEnvironment: meta.environment ?? null,
      revenueCatWebhookUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function applyEvent(uid: string, e: RcEvent): Promise<void> {
  const type = e.type ?? "";
  const meta = { type, environment: e.environment ?? undefined };

  if (type === "TEST") return;

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
    if (hasProEntitlement(e)) await setFree(uid, meta);
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

export const revenueCatWebhook = onRequest(
  {
    region: "us-central1",
    secrets: [REVENUECAT_WEBHOOK_AUTH_SECRET],
    cors: false,
    timeoutSeconds: 60,
    memory: "256MiB",
    invoker: "public",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const configuredToken = REVENUECAT_WEBHOOK_AUTH_SECRET.value()?.trim();
    if (!configuredToken) {
      console.error("revenueCatWebhook: secret REVENUECAT_WEBHOOK_AUTHORIZATION não definido");
      res.status(503).send("Server misconfiguration");
      return;
    }

    const authRaw = req.get("authorization")?.trim();
    const tokenReceived = authRaw?.startsWith("Bearer ")
      ? authRaw.slice(7).trim()
      : authRaw ?? "";
    /** Igual ao valor do cabeçalho Authorization na configuração do Webhook na RevenueCat (com ou sem prefixo Bearer). */
    if (!tokenReceived || tokenReceived !== configuredToken) {
      res.status(401).send("Unauthorized");
      return;
    }

    const payload = typeof req.body === "object" && req.body !== null ? (req.body as Record<string, unknown>) : {};

    let eventPayload: RcEvent;
    try {
      eventPayload = bodyEvent(payload);
    } catch {
      res.status(400).send("Invalid JSON payload");
      return;
    }

    const type = eventPayload.type ?? "UNKNOWN";

    try {
      if (type === "TRANSFER") {
        await applyEvent("", eventPayload);
        res.status(200).json({ received: true });
        return;
      }

      const rawUid =
        typeof eventPayload.app_user_id === "string" ? eventPayload.app_user_id.trim() : "";
      if (!rawUid) {
        console.warn("revenueCatWebhook: payload sem app_user_id", type);
        res.status(200).json({ received: true, skipped: true });
        return;
      }

      await applyEvent(rawUid, eventPayload);

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("revenueCatWebhook:", err);
      res.status(500).send("Internal error");
    }
  }
);
