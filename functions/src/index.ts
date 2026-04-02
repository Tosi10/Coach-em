/**
 * Cloud Functions – Treina+
 *
 * createAthleteByCoach: o treinador (autenticado) cria a conta do atleta
 * (Firebase Auth + Firestore users + coachemAthletes) para o atleta poder fazer login.
 */

import * as functions from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/** URLs em atributos HTML precisam de & escapado para amp; */
function hrefSafe(url: string): string {
  return url.replace(/&/g, "&amp;");
}

function buildPasswordResetHtml(resetLink: string): string {
  const link = hrefSafe(resetLink);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Treina+ — Redefinir senha</title>
  <!--[if mso]><style type="text/css">table, td { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#050505;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Redefina sua senha do Treina+ em um clique.</div>
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
                    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.65;">Recebemos uma solicitação para redefinir a senha da sua conta <strong style="color:#e5e5e5;font-weight:600;">Treina+</strong>. Se foi você, toque no botão abaixo — o link expira em breve por segurança.</p>
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

const gmailUserSecret = defineSecret("GMAIL_USER");
const gmailPassSecret = defineSecret("GMAIL_PASS");

function normalizeGmailSecrets(user: string, pass: string): { user: string; pass: string } {
  return {
    user: user.trim(),
    pass: pass.replace(/\s/g, ""),
  };
}

async function sendPasswordResetWithGmail(
  toEmail: string,
  resetLink: string,
  gmailUserRaw: string,
  gmailPassRaw: string
): Promise<void> {
  const { user: gmailUser, pass: gmailPass } = normalizeGmailSecrets(
    gmailUserRaw,
    gmailPassRaw
  );
  if (!gmailUser || !gmailPass) {
    console.error("sendPasswordResetEmailTreina: secrets GMAIL_USER / GMAIL_PASS ausentes.");
    throw new HttpsError(
      "failed-precondition",
      "Envio de email não configurado. Defina os secrets GMAIL_USER e GMAIL_PASS (veja docs/EMAIL_PASSWORD_RESET.md)."
    );
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });
  try {
    await transporter.sendMail({
      from: `"Treina+" <${gmailUser}>`,
      to: toEmail,
      subject: "Treina+ — Redefinir sua senha",
      html: buildPasswordResetHtml(resetLink),
      text:
        `Treina+ — Redefinir sua senha\n\n` +
        `Recebemos um pedido para redefinir a senha da sua conta. Use o link abaixo (válido por tempo limitado):\n\n` +
        `${resetLink}\n\n` +
        `Se você não pediu isso, ignore este e-mail — sua senha não será alterada.\n\n` +
        `— Equipe Treina+`,
    });
  } catch (mailErr: unknown) {
    const raw = mailErr instanceof Error ? mailErr.message : String(mailErr);
    console.error("sendPasswordResetEmailTreina sendMail:", raw);
    if (
      /Invalid login|535|Authentication unsuccessful|EAUTH|BadCredentials|535-5\.7\.8/i.test(raw)
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Gmail recusou o login. Confira GMAIL_USER (email completo) e GMAIL_PASS (senha de app de 16 letras, sem espaços). Gere outra senha de app se precisar."
      );
    }
    throw new HttpsError(
      "internal",
      "Não foi possível enviar o email. Tente novamente mais tarde."
    );
  }
}

interface CreateAthleteByCoachData {
  displayName: string;
  email: string;
  temporaryPassword: string;
  sport?: string;
}

/**
 * Só o treinador pode chamar. Cria o usuário no Auth, documento em users e em coachemAthletes.
 * O atleta poderá fazer login com email e temporaryPassword.
 * athleteId = uid do Auth (usado em coachemAssignedWorkouts).
 *
 * Firebase Functions v2: callable recebe um único parâmetro request com request.data e request.auth.
 */
export const createAthleteByCoach = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "É preciso estar logado."
      );
    }

    const coachId = request.auth.uid;
    const data = (request.data || {}) as CreateAthleteByCoachData;
    const { displayName, email, temporaryPassword, sport } = data;

    if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Nome do atleta é obrigatório."
      );
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email do atleta é obrigatório."
      );
    }
    if (!temporaryPassword || typeof temporaryPassword !== "string" || temporaryPassword.length < 6) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A senha provisória deve ter no mínimo 6 caracteres."
      );
    }

    const coachRef = db.collection("users").doc(coachId);
    const coachSnap = await coachRef.get();
    if (!coachSnap.exists) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Perfil do treinador não encontrado."
      );
    }
    const coachData = coachSnap.data();
    if (coachData?.userType !== "COACH") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas treinadores podem cadastrar atletas com login."
      );
    }

    const name = displayName.trim();
    const emailTrim = email.trim().toLowerCase();

    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await auth.createUser({
        email: emailTrim,
        password: temporaryPassword,
        displayName: name,
        emailVerified: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-exists") || msg.includes("already in use")) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Já existe uma conta com este email."
        );
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
      sport: sport?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const athleteDoc = {
      coachId,
      name,
      sport: sport?.trim() || null,
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
  }
);

/**
 * Recuperação de senha com email HTML (Gmail via nodemailer).
 * Não exige login: quem esqueceu a senha não está autenticado.
 * Se o email não existir no Auth, responde ok (não revela se a conta existe).
 *
 * v2 + secrets: credenciais vêm do Secret Manager (GMAIL_USER, GMAIL_PASS), não do console "Editar".
 */
export const sendPasswordResetEmailTreina = onCall(
  {
    region: "us-central1",
    secrets: [gmailUserSecret, gmailPassSecret],
  },
  async (request) => {
    const raw = (request.data || {}) as { email?: string };
    const email =
      typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Informe um email válido.");
    }

    let userExists = false;
    try {
      await auth.getUserByEmail(email);
      userExists = true;
    } catch {
      userExists = false;
    }

    if (!userExists) {
      return { ok: true };
    }

    try {
      const resetLink = await auth.generatePasswordResetLink(email);
      await sendPasswordResetWithGmail(
        email,
        resetLink,
        gmailUserSecret.value(),
        gmailPassSecret.value()
      );
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("sendPasswordResetEmailTreina:", msg);
      if (err instanceof HttpsError) throw err;
      if (
        /Invalid login|535-5\.7\.8|BadCredentials|Username and Password not accepted|EAUTH/i.test(
          msg
        )
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Gmail recusou o login: confira se GMAIL_USER é exatamente o email da conta (ex.: adm.ecg.19@gmail.com) e se GMAIL_PASS é a senha de app de 16 letras dessa mesma conta. Gere uma senha de app nova se precisar."
        );
      }
      throw new HttpsError(
        "internal",
        "Não foi possível enviar o email. Tente novamente mais tarde."
      );
    }
  }
);
