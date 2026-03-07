import emailjs from "@emailjs/nodejs";
import User from "../models/User.js";
import Account from "../models/Account.js";
import Notification from "../models/Notification.js";

// EmailJS configuration - Your credentials
const SERVICE_ID = "service_etoymbk";
const NOTIFICATION_TEMPLATE_ID = "template_14xqoeq"; // Notification template
const PUBLIC_KEY = "x-AhyXrVyij2dOpKK";

/**
 * Format currency amount
 */
const formatAmount = (amount, currency = "USD") => {
  const symbols = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
  const symbol = symbols[currency] || "$";
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format time
 */
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Generate email subject based on notification type
 */
const getEmailSubject = (notification) => {
  const { type, data } = notification;

  const subjects = {
    expense_created: `New Expense: ${formatAmount(data.amount)} for ${data.category}`,
    expense_updated: `Expense Updated: ${data.category}`,
    expense_deleted: `Expense Deleted: ${formatAmount(data.amount)}`,
    shift_assigned: `You've been assigned to ${data.shiftName} on ${formatDate(data.date)}`,
    shift_cancelled: `Shift Cancelled: ${data.shiftName}`,
    shift_checkin_submitted: `${data.memberName} checked in`,
    shift_checkout_submitted: `${data.memberName} checked out`,
    permission_granted: `New Permission Granted: ${data.permissionName}`,
    permission_revoked: `Permission Revoked: ${data.permissionName}`,
    ownership_transferred: `Account Ownership Transferred`,
    week_locked: `Week Locked: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`,
    member_invited: `New Team Member Invited`,
    bank_account_added: `Bank Account Added: ${data.bankAccountName}`,
    extra_hours_approved: `Extra Hours Approved: ${data.hours}h`,
    extra_hours_rejected: `Extra Hours Rejected`,
  };

  return subjects[type] || notification.title;
};

/**
 * Generate detailed email body
 */
const getEmailBody = (notification, accountName, userName) => {
  const { type, message, data, createdAt } = notification;

  // Build details section based on notification type
  let detailsSection = "";

  if (type.startsWith("expense_")) {
    detailsSection = `
📊 **Expense Details:**
- Amount: ${data.amount ? formatAmount(data.amount) : "N/A"}
- Category: ${data.category || "N/A"}
- Payment: ${data.paymentSource === "cash" ? "💵 Cash" : "💳 Bank"}
${data.note ? `- Note: "${data.note}"` : ""}
${data.photoCount ? `- Proofs: ${data.photoCount} photo(s) attached` : ""}
- Date: ${data.date ? formatDate(data.date) : formatDate(createdAt)}
    `.trim();
  } else if (type.startsWith("shift_")) {
    detailsSection = `
📅 **Shift Details:**
- Shift: ${data.shiftName || "N/A"}
- Date: ${data.date ? formatDate(data.date) : "N/A"}
${data.startTime ? `- Time: ${data.startTime} - ${data.endTime}` : ""}
${data.memberName ? `- Member: ${data.memberName}` : ""}
${data.checkInTime ? `- Check-in: ${formatTime(data.checkInTime)}` : ""}
${data.checkOutTime ? `- Check-out: ${formatTime(data.checkOutTime)}` : ""}
${data.location ? `- Location: ${data.location}` : ""}
    `.trim();
  } else if (type.startsWith("work_log_")) {
    detailsSection = `
⏰ **Work Log Details:**
- Member: ${data.memberName || "N/A"}
- Date: ${data.date ? formatDate(data.date) : "N/A"}
${data.startTime ? `- Time: ${data.startTime} - ${data.endTime}` : ""}
${data.durationHours ? `- Duration: ${data.durationHours}h` : ""}
${data.note ? `- Note: "${data.note}"` : ""}
    `.trim();
  } else if (type.startsWith("permission_") || type.startsWith("member_")) {
    detailsSection = `
👥 **Team Details:**
${data.memberName ? `- Member: ${data.memberName}` : ""}
${data.memberEmail ? `- Email: ${data.memberEmail}` : ""}
${data.permissionName ? `- Permission: ${data.permissionName}` : ""}
    `.trim();
  } else if (type.startsWith("bank_")) {
    detailsSection = `
🏦 **Banking Details:**
${data.bankAccountName ? `- Account: ${data.bankAccountName}` : ""}
${data.bankName ? `- Bank: ${data.bankName}` : ""}
${data.amount ? `- Amount: ${formatAmount(data.amount)}` : ""}
    `.trim();
  } else if (type.startsWith("week_")) {
    detailsSection = `
📆 **Week Details:**
${data.startDate ? `- Period: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}` : ""}
${data.totalExpenses ? `- Total Expenses: ${formatAmount(data.totalExpenses)}` : ""}
    `.trim();
  } else if (
    type === "ownership_transferred" ||
    type.startsWith("ownership_")
  ) {
    detailsSection = `
👑 **Ownership Details:**
${data.fromName ? `- From: ${data.fromName}` : ""}
${data.toName ? `- To: ${data.toName}` : ""}
${data.reason ? `- Reason: ${data.reason}` : ""}
    `.trim();
  }

  // Build complete email body
  const body = `
Hi ${userName},

${message}

${detailsSection}

---

📍 Account: ${accountName}
🕐 Time: ${formatDate(createdAt)} at ${formatTime(createdAt)}

---

This notification was sent because you're a member of "${accountName}".
To manage your notification preferences, visit Settings → Notifications in the app.
  `.trim();

  return body;
};

/**
 * Send notification email to user
 */
export const sendNotificationEmail = async (notification, userId) => {
  try {
    // Get user and account details
    const [user, account] = await Promise.all([
      User.findById(userId),
      Account.findById(notification.accountId),
    ]);

    if (!user || !account) {
      console.error("User or account not found for notification email");
      return false;
    }

    const emailSubject = getEmailSubject(notification);
    const emailBody = getEmailBody(
      notification,
      account.accountName,
      user.firstName,
    );

    console.log("\n📧 SENDING EMAIL via EmailJS:");
    console.log(`   To: ${user.email} (${user.firstName})`);
    console.log(`   Subject: ${emailSubject}`);
    console.log(`   Service ID: ${SERVICE_ID}`);
    console.log(`   Template ID: ${NOTIFICATION_TEMPLATE_ID}`);

    // Send email via EmailJS
    await emailjs.send(
      SERVICE_ID,
      NOTIFICATION_TEMPLATE_ID,
      {
        to_email: user.email,
        to_name: user.firstName,
        subject: emailSubject,
        notification_title: notification.title,
        notification_message: notification.message,
        email_body: emailBody,
        account_name: account.accountName,
        priority: notification.priority.toUpperCase(),
        created_at: new Date(notification.createdAt).toLocaleString(),
      },
      {
        publicKey: PUBLIC_KEY,
      },
    );

    console.log("✅ Email sent successfully via EmailJS!");

    // Update notification as email sent
    notification.emailSent = true;
    notification.emailSentAt = new Date();
    await notification.save();

    return true;
  } catch (error) {
    console.error("Error sending notification email:", error);
    return false;
  }
};

/**
 * Send digest email (for hourly/daily digests)
 */
export const sendDigestEmail = async (userId, notifications, frequency) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    // Group notifications by account
    const byAccount = {};
    for (const notif of notifications) {
      const accountId = notif.accountId.toString();
      if (!byAccount[accountId]) {
        byAccount[accountId] = [];
      }
      byAccount[accountId].push(notif);
    }

    // Build digest email
    let digestBody = `Hi ${user.firstName},\n\nHere's your ${frequency} notification digest:\n\n`;

    for (const [accountId, accountNotifs] of Object.entries(byAccount)) {
      const account = await Account.findById(accountId);
      if (!account) continue;

      digestBody += `\n📁 **${account.accountName}** (${accountNotifs.length} notifications)\n\n`;

      accountNotifs.forEach((notif, idx) => {
        digestBody += `${idx + 1}. ${notif.title}\n   ${notif.message}\n\n`;
      });
    }

    digestBody += `\nView all notifications in the app.\n`;

    console.log("📧 Sending digest email:");
    console.log(`To: ${user.email}`);
    console.log(`Subject: Your ${frequency} Notification Digest`);
    console.log(`Body:\n${digestBody}`);

    // TODO: Send via EmailJS

    return true;
  } catch (error) {
    console.error("Error sending digest email:", error);
    return false;
  }
};

export default {
  sendNotificationEmail,
  sendDigestEmail,
};
