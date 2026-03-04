import Account from "../models/Account.js";

/**
 * Generate a unique account ID in the format: ACC-XXXXXX
 * Where X is an alphanumeric character (A-Z, 0-9)
 *
 * This ID is used for:
 * - Account linking (parent-child relationships)
 * - Ownership transfer
 * - Easy account identification
 *
 * @returns {Promise<string>} Unique account ID (e.g., "ACC-A1B2C3")
 */
export const generateAccountUniqueId = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const idLength = 6;
  let uniqueId;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  while (exists && attempts < maxAttempts) {
    // Generate random 6-character alphanumeric string
    const randomPart = Array.from({ length: idLength }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length)),
    ).join("");

    uniqueId = `ACC-${randomPart}`;

    // Check if this ID already exists in database
    const existing = await Account.findOne({ uniqueId });
    exists = !!existing;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error(
      "Failed to generate unique account ID after multiple attempts",
    );
  }

  return uniqueId;
};

/**
 * Validate unique ID format
 * Must be: ACC-XXXXXX where X is alphanumeric
 *
 * @param {string} uniqueId - The ID to validate
 * @returns {boolean} True if valid format
 */
export const validateUniqueIdFormat = (uniqueId) => {
  const pattern = /^ACC-[A-Z0-9]{6}$/;
  return pattern.test(uniqueId);
};
