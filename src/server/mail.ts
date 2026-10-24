// Outgoing email. The rest of the app only calls sendMail, so changing how
// email is sent changes this file alone.
//
//   MAIL_DRIVER=console  (default) prints each email in the server's terminal
//   MAIL_DRIVER=brevo    sends through Brevo (BREVO_API_KEY, MAIL_FROM)
import "server-only";

type Mail = { subject: string; text: string; replyTo?: string };

const driver = process.env.MAIL_DRIVER ?? "console";
// Where notifications go: MAIL_TO, or else the admin's own address
const to = process.env.MAIL_TO || process.env.ADMIN_EMAIL;

// Resolves once sent; throws if it couldn't be
export async function sendMail(mail: Mail) {
  if (!to) throw new Error("Set MAIL_TO or ADMIN_EMAIL so emails have somewhere to go.");
  if (driver === "console") return printMail(mail);
  if (driver === "brevo") return sendWithBrevo(mail);
  throw new Error(`MAIL_DRIVER "${driver}" isn't supported. Use "console" or "brevo".`);
}

function printMail({ subject, text, replyTo }: Mail) {
  const rule = "─".repeat(60);
  console.info([rule, `To: ${to}`, replyTo && `Reply-To: ${replyTo}`, `Subject: ${subject}`, "", text, rule].filter((line) => line !== undefined).join("\n"));
}

// Brevo's HTTP API (no SDK needed). MAIL_FROM must be a sender verified in
// the Brevo account, written "Name <address>" or just the address.
async function sendWithBrevo({ subject, text, replyTo }: Mail) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("MAIL_DRIVER is brevo but BREVO_API_KEY is empty.");
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("MAIL_DRIVER is brevo but MAIL_FROM is empty. Use a sender verified in Brevo.");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: parseAddress(from),
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(replyTo && { replyTo: { email: replyTo } }),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Brevo refused the email (${response.status}): ${await response.text()}`);
}

// "Peyyala <notifications@peyyala.com>" -> { name: "Peyyala", email: "notifications@peyyala.com" }
function parseAddress(value: string) {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return match ? { ...(match[1] && { name: match[1].replace(/^"|"$/g, "") }), email: match[2] } : { email: value.trim() };
}
