import { Resend } from "resend";
import type { ContactMessage } from "@prisma/client";

function escapeHtml(value: string | null | undefined) {
  return (value ?? "—").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character);
}

export async function sendContactNotification(message: ContactMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFICATION_EMAIL ?? "fijacksp@gmail.com";
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") throw new Error("Email provider is not configured.");
    console.info(`[email skipped] New contact from ${message.email} to ${to}`);
    return { id: "local-email-skipped" };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    replyTo: message.email,
    subject: `New website enquiry: ${message.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0b172a">
        <div style="background:#062f5f;color:#fff;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="font-size:20px;margin:0">New Website Contact</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px">
          <p><strong>Name:</strong> ${escapeHtml(message.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(message.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(message.phone)}</p>
          <p><strong>Organisation:</strong> ${escapeHtml(message.organisation)}</p>
          <p><strong>Area of interest:</strong> ${escapeHtml(message.service)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(message.subject)}</p>
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:22px 0">
          <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(message.message)}</p>
        </div>
      </div>`
  });

  if (result.error) throw new Error(result.error.message);
  return result.data;
}
