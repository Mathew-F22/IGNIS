import nodemailer from 'nodemailer';

// O envio de e-mail é opcional. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM
// (por exemplo, uma conta Gmail com "senha de app", sem custo). Sem isso, os pedidos de
// recuperação aparecem para o login mestre, que redefine a senha pelo painel.
let transport = null;
export const mailEnabled = () => !!process.env.SMTP_HOST;

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transport;
}

export async function sendResetEmail(to, name, link) {
  await getTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'IGNIS · Redefinição de senha',
    text: `Olá, ${name}.\n\nPara criar uma nova senha no IGNIS, abra o link abaixo (válido por 1 hora):\n${link}\n\nSe você não pediu, ignore este e-mail.`,
    html: `<div style="font-family:Inter,Arial,sans-serif;color:#011E41;max-width:480px">
      <h2 style="font-weight:600">Redefinição de senha</h2>
      <p>Olá, ${name}. Para criar uma nova senha no IGNIS, clique no botão abaixo. O link vale por 1 hora.</p>
      <p><a href="${link}" style="display:inline-block;background:#011E41;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none">Criar nova senha</a></p>
      <p style="color:#6b7280;font-size:13px">Se você não pediu, ignore este e-mail.</p></div>`,
  });
}
