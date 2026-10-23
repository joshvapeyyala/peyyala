// Outgoing email. The rest of the app only calls sendMail, so moving from the
// terminal to Resend or SES changes this file alone.
//
//   MAIL_DRIVER=console  (default) prints each email in the server's terminal
//   MAIL_DRIVER=resend   sends through Resend (RESEND_API_KEY, MAIL_FROM)
import "server-only";

type Mail = { subject: string; text: string; replyTo?: string };

const driver = process.env.MAIL_DRIVER ?? "console";
// Where notifications go: MAIL_TO, or else the admin's own address
const to = process.env.MAIL_TO || process.env.ADMIN_EMAIL;

// Resolves once sent; throws if it couldn't be
export async function sendMail(mail: Mail) {
  if (!to) throw new Error("Set MAIL_TO or ADMIN_EMAIL so emails have somewhere to go.");
  if (driver === "console") return printMail(mail);
  if (driver === "resend") return sendWithResend(mail);
  throw new Error(`MAIL_DRIVER "${driver}" isn't supported. Use "console" or "resend".`);
}

function printMail({ subject, text, replyTo }: Mail) {
  const rule = "─".repeat(60);
  console.info([rule, `To: ${to}`, replyTo && `Reply-To: ${replyTo}`, `Subject: ${subject}`, "", text, rule].filter((line) => line !== undefined).join("\n"));
}

// Resend's HTTP API (no SDK needed). Its test sender, onboarding@resend.dev,
// can only send to the address the Resend account was created with.
async function sendWithResend({ subject, text, replyTo }: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("MAIL_DRIVER is resend but RESEND_API_KEY is empty.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Portfolio <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
      ...(replyTo && { reply_to: replyTo }),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend refused the email (${response.status}): ${await response.text()}`);
}
