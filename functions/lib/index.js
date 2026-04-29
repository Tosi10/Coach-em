"use strict";
/**
 * Cloud Functions – Coach'em
 *
 * createAthleteByCoach: o treinador (autenticado) cria a conta do atleta
 * (Firebase Auth + Firestore users + coachemAthletes) para o atleta poder fazer login.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchAthleteWorkoutPushReminders = exports.sendEmailVerificationTreina = exports.sendPasswordResetEmailTreina = exports.createAthleteByCoach = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const expo_server_sdk_1 = require("expo-server-sdk");
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const expo = new expo_server_sdk_1.Expo();
/** Apenas Cloud Functions (Admin); clientes não têm match nas rules → negado. */
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
/**
 * Limita envios de email por destino e por IP (janela de 1 hora, bucket por hora UTC).
 */
async function consumePublicEmailRateLimits(action, email, clientIp) {
    const maxEmail = action === "passwordReset" ? 4 : 6;
    const maxIp = action === "passwordReset" ? 20 : 25;
    const emailDoc = rateDocId(action, `email:${email}`);
    const ipDoc = rateDocId(action, `ip:${clientIp}`);
    await db.runTransaction(async (t) => {
        var _a, _b, _c, _d;
        const refE = db.collection(RATE_LIMIT_COLLECTION).doc(emailDoc);
        const refI = db.collection(RATE_LIMIT_COLLECTION).doc(ipDoc);
        const snapE = await t.get(refE);
        const snapI = await t.get(refI);
        const nextE = (_b = (_a = snapE.data()) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0;
        const nextI = (_d = (_c = snapI.data()) === null || _c === void 0 ? void 0 : _c.count) !== null && _d !== void 0 ? _d : 0;
        if (nextE + 1 > maxEmail || nextI + 1 > maxIp) {
            throw new https_1.HttpsError("resource-exhausted", "Muitas solicitações de email. Aguarde cerca de uma hora ou tente mais tarde.");
        }
        const ts = admin.firestore.FieldValue.serverTimestamp();
        t.set(refE, { count: nextE + 1, action, kind: "email", updatedAt: ts }, { merge: true });
        t.set(refI, { count: nextI + 1, action, kind: "ip", updatedAt: ts }, { merge: true });
    });
}
/** Evita treinador a disparar criação+email em massa acidental ou script. */
async function consumeCreateAthleteEmailRate(coachId) {
    const max = 35;
    const docId = rateDocId("createAthleteEmail", `coach:${coachId}`);
    const ref = db.collection(RATE_LIMIT_COLLECTION).doc(docId);
    await db.runTransaction(async (t) => {
        var _a, _b;
        const snap = await t.get(ref);
        const next = (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0;
        if (next + 1 > max) {
            throw new https_1.HttpsError("resource-exhausted", "Limite de cadastros de atletas com email nesta hora. Tente novamente mais tarde.");
        }
        t.set(ref, {
            count: next + 1,
            action: "createAthleteEmail",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
}
/** URLs em atributos HTML precisam de & escapado para amp; */
function hrefSafe(url) {
    return url.replace(/&/g, "&amp;");
}
function buildPasswordResetHtml(resetLink) {
    const link = hrefSafe(resetLink);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Coach'em — Redefinir senha</title>
  <!--[if mso]><style type="text/css">table, td { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#050505;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Redefina sua senha do Coach'em em um clique.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#0a0a0a 0%,#050505 40%,#0a0a0a 100%);padding:40px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 4px 0 0;font-size:32px;line-height:1;font-weight:800;letter-spacing:-0.03em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <span style="color:#fb923c;">Treina</span><span style="color:#fafafa;">+</span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:11px;color:#737373;letter-spacing:0.22em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Performance esportiva</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111111;border-radius:20px;border:1px solid #262626;box-shadow:0 24px 48px rgba(0,0,0,0.45),0 0 0 1px rgba(251,146,60,0.08) inset;overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#ea580c,#f97316,#fb923c);line-height:0;font-size:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:36px 32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fb923c;letter-spacing:0.04em;text-transform:uppercase;">Segurança da conta</p>
                    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;line-height:1.35;letter-spacing:-0.02em;">Criar uma nova senha</h1>
                    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.65;">Recebemos uma solicitação para redefinir a senha da sua conta <strong style="color:#e5e5e5;font-weight:600;">Coach'em</strong>. Se foi você, toque no botão abaixo — o link expira em breve por segurança.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <a href="${link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f97316 0%,#ea580c 50%,#c2410c 100%);color:#ffffff !important;text-decoration:none;font-weight:700;font-size:16px;border-radius:14px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(234,88,12,0.35),0 2px 0 rgba(255,255,255,0.12) inset;">Redefinir minha senha</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 10px;font-size:12px;color:#737373;line-height:1.5;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0d0d0d;border-radius:12px;border:1px solid #262626;">
                      <tr>
                        <td style="padding:14px 16px;font-size:11px;color:#a3a3a3;word-break:break-all;line-height:1.55;font-family:ui-monospace,SFMono-Regular,'Segoe UI Mono',Menlo,Consolas,monospace;">${link}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px 32px;border-top:1px solid #1f1f1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                    <p style="margin:0;font-size:13px;color:#737373;line-height:1.6;text-align:center;">Não reconhece este pedido? Ignore este e-mail com tranquilidade — <strong style="color:#a3a3a3;font-weight:600;">sua senha permanece a mesma.</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 8px 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <p style="margin:0 0 6px;font-size:12px;color:#525252;line-height:1.5;">Enviado automaticamente para ajudar você a recuperar o acesso.</p>
              <p style="margin:0;font-size:11px;color:#404040;letter-spacing:0.06em;"><span style="color:#fb923c;font-weight:700;">Treina</span><span style="color:#525252;font-weight:700;">+</span> · gestão de performance</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function buildEmailVerificationHtml(verificationLink) {
    const link = hrefSafe(verificationLink);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Coach'em - Confirmar email</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Confirme seu email e ative sua conta Coach'em.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#0a0a0a 0%,#050505 40%,#0a0a0a 100%);padding:40px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <p style="margin:0;font-size:32px;line-height:1;font-weight:800;letter-spacing:-0.03em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                <span style="color:#fb923c;">Treina</span><span style="color:#fafafa;">+</span>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#737373;letter-spacing:0.22em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Performance esportiva</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111111;border-radius:20px;border:1px solid #262626;box-shadow:0 24px 48px rgba(0,0,0,0.45),0 0 0 1px rgba(251,146,60,0.08) inset;overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#ea580c,#f97316,#fb923c);line-height:0;font-size:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:36px 32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fb923c;letter-spacing:0.04em;text-transform:uppercase;">Ativação de conta</p>
                    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;line-height:1.35;letter-spacing:-0.02em;">Confirme seu email</h1>
                    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.65;">Para concluir seu cadastro no <strong style="color:#e5e5e5;font-weight:600;">Coach'em</strong>, confirme seu endereço de email no botão abaixo.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <a href="${link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f97316 0%,#ea580c 50%,#c2410c 100%);color:#ffffff !important;text-decoration:none;font-weight:700;font-size:16px;border-radius:14px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(234,88,12,0.35),0 2px 0 rgba(255,255,255,0.12) inset;">Confirmar meu email</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 10px;font-size:12px;color:#737373;line-height:1.5;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0d0d0d;border-radius:12px;border:1px solid #262626;">
                      <tr>
                        <td style="padding:14px 16px;font-size:11px;color:#a3a3a3;word-break:break-all;line-height:1.55;font-family:ui-monospace,SFMono-Regular,'Segoe UI Mono',Menlo,Consolas,monospace;">${link}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px 32px;border-top:1px solid #1f1f1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                    <p style="margin:0;font-size:13px;color:#737373;line-height:1.6;text-align:center;">Se você não solicitou este cadastro, pode ignorar este email com segurança.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
const gmailUserSecret = (0, params_1.defineSecret)("GMAIL_USER");
const gmailPassSecret = (0, params_1.defineSecret)("GMAIL_PASS");
function normalizeGmailSecrets(user, pass) {
    return {
        user: user.trim(),
        pass: pass.replace(/\s/g, ""),
    };
}
async function sendPasswordResetWithGmail(toEmail, resetLink, gmailUserRaw, gmailPassRaw) {
    const { user: gmailUser, pass: gmailPass } = normalizeGmailSecrets(gmailUserRaw, gmailPassRaw);
    if (!gmailUser || !gmailPass) {
        console.error("sendPasswordResetEmailTreina: secrets GMAIL_USER / GMAIL_PASS ausentes.");
        throw new https_1.HttpsError("failed-precondition", "Envio de email não configurado. Defina os secrets GMAIL_USER e GMAIL_PASS (veja docs/EMAIL_PASSWORD_RESET.md).");
    }
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
    });
    try {
        await transporter.sendMail({
            from: `"Coach'em" <${gmailUser}>`,
            to: toEmail,
            subject: "Coach'em — Redefinir sua senha",
            html: buildPasswordResetHtml(resetLink),
            text: `Coach'em — Redefinir sua senha\n\n` +
                `Recebemos um pedido para redefinir a senha da sua conta. Use o link abaixo (válido por tempo limitado):\n\n` +
                `${resetLink}\n\n` +
                `Se você não pediu isso, ignore este e-mail — sua senha não será alterada.\n\n` +
                `— Equipe Coach'em`,
        });
    }
    catch (mailErr) {
        const raw = mailErr instanceof Error ? mailErr.message : String(mailErr);
        console.error("sendPasswordResetEmailTreina sendMail:", raw);
        if (/Invalid login|535|Authentication unsuccessful|EAUTH|BadCredentials|535-5\.7\.8/i.test(raw)) {
            throw new https_1.HttpsError("failed-precondition", "Gmail recusou o login. Confira GMAIL_USER (email completo) e GMAIL_PASS (senha de app de 16 letras, sem espaços). Gere outra senha de app se precisar.");
        }
        throw new https_1.HttpsError("internal", "Não foi possível enviar o email. Tente novamente mais tarde.");
    }
}
async function sendEmailVerificationWithGmail(toEmail, verificationLink, gmailUserRaw, gmailPassRaw) {
    const { user: gmailUser, pass: gmailPass } = normalizeGmailSecrets(gmailUserRaw, gmailPassRaw);
    if (!gmailUser || !gmailPass) {
        console.error("sendEmailVerificationTreina: secrets GMAIL_USER / GMAIL_PASS ausentes.");
        throw new https_1.HttpsError("failed-precondition", "Envio de email não configurado. Defina os secrets GMAIL_USER e GMAIL_PASS.");
    }
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
    });
    try {
        await transporter.sendMail({
            from: `"Coach'em" <${gmailUser}>`,
            to: toEmail,
            subject: "Coach'em - Confirme seu email",
            html: buildEmailVerificationHtml(verificationLink),
            text: `Coach'em — Confirmação de email\n\n` +
                `Para ativar sua conta, confirme seu email no link abaixo:\n\n` +
                `${verificationLink}\n\n` +
                `Se você não solicitou este cadastro, ignore esta mensagem.\n\n` +
                `— Equipe Coach'em`,
        });
    }
    catch (mailErr) {
        const raw = mailErr instanceof Error ? mailErr.message : String(mailErr);
        console.error("sendEmailVerificationTreina sendMail:", raw);
        throw new https_1.HttpsError("internal", "Não foi possível enviar o email de confirmação. Tente novamente mais tarde.");
    }
}
/**
 * Só o treinador pode chamar. Cria o usuário no Auth, documento em users e em coachemAthletes.
 * O atleta poderá fazer login com email e temporaryPassword.
 * athleteId = uid do Auth (usado em coachemAssignedWorkouts).
 *
 * Firebase Functions v2: callable com secrets Gmail para enviar o mesmo email de confirmação Coach'em.
 */
exports.createAthleteByCoach = (0, https_1.onCall)({
    region: "us-central1",
    secrets: [gmailUserSecret, gmailPassSecret],
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "É preciso estar logado.");
    }
    const coachId = request.auth.uid;
    const data = (request.data || {});
    const { displayName, email, temporaryPassword, sport } = data;
    if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
        throw new https_1.HttpsError("invalid-argument", "Nome do atleta é obrigatório.");
    }
    if (!email || typeof email !== "string" || !email.trim()) {
        throw new https_1.HttpsError("invalid-argument", "Email do atleta é obrigatório.");
    }
    if (!temporaryPassword ||
        typeof temporaryPassword !== "string" ||
        temporaryPassword.length < 6) {
        throw new https_1.HttpsError("invalid-argument", "A senha provisória deve ter no mínimo 6 caracteres.");
    }
    const coachRef = db.collection("users").doc(coachId);
    const coachSnap = await coachRef.get();
    if (!coachSnap.exists) {
        throw new https_1.HttpsError("failed-precondition", "Perfil do treinador não encontrado.");
    }
    const coachData = coachSnap.data();
    if ((coachData === null || coachData === void 0 ? void 0 : coachData.userType) !== "COACH") {
        throw new https_1.HttpsError("permission-denied", "Apenas treinadores podem cadastrar atletas com login.");
    }
    await consumeCreateAthleteEmailRate(coachId);
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
            throw new https_1.HttpsError("already-exists", "Já existe uma conta com este email.");
        }
        throw new https_1.HttpsError("internal", `Erro ao criar conta: ${msg}`);
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
    try {
        const verifyLink = await auth.generateEmailVerificationLink(emailTrim);
        await sendEmailVerificationWithGmail(emailTrim, verifyLink, gmailUserSecret.value(), gmailPassSecret.value());
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("createAthleteByCoach: falha ao enviar confirmação:", msg);
        await db.collection("users").doc(uid).delete().catch(() => undefined);
        await db.collection("coachemAthletes").doc(uid).delete().catch(() => undefined);
        try {
            await auth.deleteUser(uid);
        }
        catch (delAuth) {
            console.error("createAthleteByCoach: rollback auth:", delAuth);
        }
        if (err instanceof https_1.HttpsError)
            throw err;
        throw new https_1.HttpsError("internal", "Não foi possível enviar o email de confirmação para o atleta. Nada foi salvo — tente novamente.");
    }
    return { athleteId: uid };
});
/**
 * Recuperação de senha com email HTML (Gmail via nodemailer).
 * Não exige login: quem esqueceu a senha não está autenticado.
 * Se o email não existir no Auth, responde ok (não revela se a conta existe).
 *
 * v2 + secrets: credenciais vêm do Secret Manager (GMAIL_USER, GMAIL_PASS), não do console "Editar".
 */
exports.sendPasswordResetEmailTreina = (0, https_1.onCall)({
    region: "us-central1",
    secrets: [gmailUserSecret, gmailPassSecret],
}, async (request) => {
    const raw = (request.data || {});
    const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
        throw new https_1.HttpsError("invalid-argument", "Informe um email válido.");
    }
    await consumePublicEmailRateLimits("passwordReset", email, getClientIp(request));
    let userExists = false;
    try {
        await auth.getUserByEmail(email);
        userExists = true;
    }
    catch (_a) {
        userExists = false;
    }
    if (!userExists) {
        return { ok: true };
    }
    try {
        const resetLink = await auth.generatePasswordResetLink(email);
        await sendPasswordResetWithGmail(email, resetLink, gmailUserSecret.value(), gmailPassSecret.value());
        return { ok: true };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("sendPasswordResetEmailTreina:", msg);
        if (err instanceof https_1.HttpsError)
            throw err;
        if (/Invalid login|535-5\.7\.8|BadCredentials|Username and Password not accepted|EAUTH/i.test(msg)) {
            throw new https_1.HttpsError("failed-precondition", "Gmail recusou o login: confira se GMAIL_USER é exatamente o email da conta (ex.: adm.ecg.19@gmail.com) e se GMAIL_PASS é a senha de app de 16 letras dessa mesma conta. Gere uma senha de app nova se precisar.");
        }
        throw new https_1.HttpsError("internal", "Não foi possível enviar o email. Tente novamente mais tarde.");
    }
});
/**
 * Confirmação de email com template Coach'em (Gmail via nodemailer).
 * Não revela existência da conta (retorna ok mesmo quando email não existe).
 */
exports.sendEmailVerificationTreina = (0, https_1.onCall)({
    region: "us-central1",
    secrets: [gmailUserSecret, gmailPassSecret],
}, async (request) => {
    const raw = (request.data || {});
    const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
        throw new https_1.HttpsError("invalid-argument", "Informe um email válido.");
    }
    await consumePublicEmailRateLimits("emailVerify", email, getClientIp(request));
    let userRecord = null;
    try {
        userRecord = await auth.getUserByEmail(email);
    }
    catch (_a) {
        userRecord = null;
    }
    if (!userRecord) {
        return { ok: true };
    }
    if (userRecord.emailVerified) {
        return { ok: true };
    }
    try {
        const verifyLink = await auth.generateEmailVerificationLink(email);
        await sendEmailVerificationWithGmail(email, verifyLink, gmailUserSecret.value(), gmailPassSecret.value());
        return { ok: true };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("sendEmailVerificationTreina:", msg);
        if (err instanceof https_1.HttpsError)
            throw err;
        throw new https_1.HttpsError("internal", "Não foi possível enviar o email de confirmação. Tente novamente mais tarde.");
    }
});
function formatDateInTimeZone(date, timeZone) {
    // sv-SE retorna YYYY-MM-DD, ideal para comparação e query por string.
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}
function parseWorkoutDateTime(dateStr, timeStr) {
    // App opera no Brasil; armazenamos horário local e convertemos para offset -03:00.
    return new Date(`${dateStr}T${timeStr}:00-03:00`);
}
async function getAthletePushToken(athleteId) {
    if (!athleteId)
        return null;
    const userSnap = await db.collection("users").doc(athleteId).get();
    const token = userSnap.get("expoPushToken");
    if (typeof token !== "string" || !expo_server_sdk_1.Expo.isExpoPushToken(token))
        return null;
    return token;
}
async function sendExpoPush(message) {
    var _a;
    try {
        const tickets = await expo.sendPushNotificationsAsync([message]);
        return ((_a = tickets[0]) === null || _a === void 0 ? void 0 : _a.status) === "ok";
    }
    catch (error) {
        console.error("dispatchAthleteWorkoutPushReminders sendExpoPush:", error);
        return false;
    }
}
/**
 * Push remoto para atletas:
 * - 30 minutos antes do treino
 * - na hora do treino
 *
 * Roda em loop (scheduler) para funcionar com app em background/fechado.
 */
exports.dispatchAthleteWorkoutPushReminders = (0, scheduler_1.onSchedule)({
    schedule: "every 5 minutes",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
}, async () => {
    var _a;
    const now = new Date();
    const nowMs = now.getTime();
    const yesterday = new Date(nowMs - 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(nowMs + 48 * 60 * 60 * 1000);
    const minDate = formatDateInTimeZone(yesterday, "America/Sao_Paulo");
    const maxDate = formatDateInTimeZone(dayAfterTomorrow, "America/Sao_Paulo");
    const workoutsSnap = await db
        .collection("coachemAssignedWorkouts")
        .where("date", ">=", minDate)
        .where("date", "<=", maxDate)
        .get();
    if (workoutsSnap.empty)
        return;
    const athleteTokenCache = new Map();
    for (const workoutDoc of workoutsSnap.docs) {
        const data = workoutDoc.data();
        const status = String((_a = data.status) !== null && _a !== void 0 ? _a : "").toLowerCase();
        if (status === "concluído" || status === "concluido" || status === "completed")
            continue;
        const athleteId = typeof data.athleteId === "string" ? data.athleteId : "";
        const workoutName = typeof data.name === "string" ? data.name : "Treino";
        const dateStr = typeof data.date === "string" ? data.date : "";
        const timeStr = typeof data.scheduledTime === "string" ? data.scheduledTime : "";
        if (!athleteId || !dateStr || !timeStr)
            continue;
        const workoutAt = parseWorkoutDateTime(dateStr, timeStr);
        if (Number.isNaN(workoutAt.getTime()))
            continue;
        const msUntilWorkout = workoutAt.getTime() - nowMs;
        const already30 = !!data.remoteReminder30SentAt;
        const alreadyStart = !!data.remoteReminderStartSentAt;
        const shouldSend30 = !already30 && msUntilWorkout <= 30 * 60 * 1000 && msUntilWorkout > 25 * 60 * 1000;
        const shouldSendStart = !alreadyStart && msUntilWorkout <= 0 && msUntilWorkout > -5 * 60 * 1000;
        if (!shouldSend30 && !shouldSendStart)
            continue;
        let athleteToken = athleteTokenCache.get(athleteId);
        if (athleteToken === undefined) {
            athleteToken = await getAthletePushToken(athleteId);
            athleteTokenCache.set(athleteId, athleteToken);
        }
        if (!athleteToken)
            continue;
        const updates = {};
        if (shouldSend30) {
            const sent = await sendExpoPush({
                to: athleteToken,
                title: "Treino em 30 min 💪",
                body: `"${workoutName}" às ${timeStr}. Prepare-se!`,
                sound: "default",
                priority: "high",
                data: { workoutId: workoutDoc.id, reminderType: "thirty-minutes" },
            });
            if (sent)
                updates.remoteReminder30SentAt = admin.firestore.FieldValue.serverTimestamp();
        }
        if (shouldSendStart) {
            const sent = await sendExpoPush({
                to: athleteToken,
                title: "Hora do treino! 💪",
                body: `"${workoutName}" - comece agora.`,
                sound: "default",
                priority: "high",
                data: { workoutId: workoutDoc.id, reminderType: "start" },
            });
            if (sent)
                updates.remoteReminderStartSentAt = admin.firestore.FieldValue.serverTimestamp();
        }
        if (Object.keys(updates).length > 0) {
            await workoutDoc.ref.set(updates, { merge: true });
        }
    }
});
