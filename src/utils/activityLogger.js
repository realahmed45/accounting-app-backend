import ActivityLog from "../models/ActivityLog.js";

/**
 * Fire-and-forget activity logger.
 * Call this after any significant action — errors are swallowed so they
 * never break the main request/response flow.
 *
 * @param {Object} opts
 * @param {string} opts.accountId
 * @param {string} opts.actorUserId
 * @param {string} opts.actorDisplayName  - snapshot of the actor's name
 * @param {string} opts.action            - one of the enum values in ActivityLog
 * @param {string} [opts.targetDescription]
 * @param {Object} [opts.metadata]
 */
export const logActivity = ({
  accountId,
  actorUserId,
  actorDisplayName,
  action,
  targetDescription = "",
  metadata = {},
}) => {
  // Not awaited — we don't block the caller
  ActivityLog.create({
    accountId,
    actorUserId,
    actorDisplayName,
    action,
    targetDescription,
    metadata,
  }).catch((err) => {
    console.error("[ActivityLog] Failed to write log:", err.message);
  });
};
