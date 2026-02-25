import nodemailer from "nodemailer";

/**
 * Build a transporter from env vars.
 * Supports any SMTP provider (Gmail, Outlook, SendGrid, Mailgun, etc.)
 *
 * Required env vars:
 *   SMTP_HOST      e.g. smtp.gmail.com
 *   SMTP_PORT      e.g. 587
 *   SMTP_USER      your sending email address
 *   SMTP_PASS      your password / app password
 *   EMAIL_FROM     display name + address, e.g. "My App <noreply@myapp.com>"
 *
 * If SMTP_HOST is not set, the function will skip sending and instead
 * return the invite link so it can be shown directly to the inviter.
 */
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587"),
    secure: parseInt(SMTP_PORT || "587") === 465, // true for 465, false for others
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

/**
 * Send an invitation email.
 * @returns {Promise<{ sent: boolean, previewUrl?: string }>}
 *   If email sending is not configured, `sent` is false and
 *   callers should surface the invite link themselves.
 */
export const sendInvitationEmail = async ({
  toEmail,
  inviterName,
  accountName,
  inviteLink,
  permissions,
}) => {
  const transporter = createTransporter();

  const permLabels = {
    makeExpense: "Log expenses",
    calculateCash: "Calculate cash flow",
    accessSettings: "Access settings",
    addUser: "Manage users",
    addCategories: "Manage categories",
    addBankAccount: "Manage bank accounts",
    createAccountDownward: "Create sub-accounts",
    createAccountUpward: "Link to parent accounts",
  };

  const grantedPerms = Object.entries(permissions)
    .filter(([, v]) => v)
    .map(([k]) => `<li style="margin:4px 0">✓ ${permLabels[k] || k}</li>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#4f46e5;padding:32px 40px">
      <h1 style="color:#fff;margin:0;font-size:22px">You're invited to join an account</h1>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#374151;font-size:15px;margin-top:0">
        <strong>${inviterName}</strong> has invited you to join
        <strong>${accountName}</strong> on the Accounting App.
      </p>
      ${
        grantedPerms
          ? `
      <p style="color:#374151;font-size:14px;margin-bottom:8px"><strong>Your permissions will include:</strong></p>
      <ul style="color:#374151;font-size:14px;padding-left:20px;margin-top:0">${grantedPerms}</ul>
      `
          : ""
      }
      <div style="margin:32px 0;text-align:center">
        <a href="${inviteLink}"
           style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600">
          Accept Invitation
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px">
        This invitation expires in <strong>7 days</strong>.
        If you weren't expecting this, you can safely ignore it.
      </p>
      <p style="color:#9ca3af;font-size:12px;word-break:break-all">
        Or copy this link: ${inviteLink}
      </p>
    </div>
  </div>
</body>
</html>`;

  const from =
    process.env.EMAIL_FROM || `Accounting App <${process.env.SMTP_USER}>`;

  if (!transporter) {
    // Email not configured — caller must handle the invite link manually
    return { sent: false };
  }

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: `${inviterName} invited you to join ${accountName}`,
    html,
  });

  return { sent: true };
};
