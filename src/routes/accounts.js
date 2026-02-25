import express from "express";
import {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  getCategories,
  createCategory,
  getPeople,
  createPerson,
} from "../controllers/accountController.js";
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "../controllers/bankAccountController.js";
import {
  getMembers,
  addMember,
  updateMember,
  removeMember,
  transferOwnership,
  getMyMembership,
} from "../controllers/accountMemberController.js";
import {
  getRelationships,
  createDownwardAccount,
  linkUpwardAccount,
  linkSidewaysAccount,
  removeRelationship,
} from "../controllers/accountRelationshipController.js";
import {
  getAccountInvitations,
  cancelInvitation,
} from "../controllers/invitationController.js";
import { getActivityLog } from "../controllers/activityController.js";
import {
  requestOwnershipCorrection,
  getTransferStatus,
} from "../controllers/ownershipCorrectionController.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(protect, getAccounts).post(protect, createAccount);

router
  .route("/:id")
  .get(protect, getAccount)
  .put(protect, updateAccount)
  .delete(protect, deleteAccount);

router
  .route("/:id/categories")
  .get(protect, getCategories)
  .post(protect, requirePermission("addCategories"), createCategory);

router.route("/:id/people").get(protect, getPeople).post(protect, createPerson);

router
  .route("/:id/bank-accounts")
  .get(protect, getBankAccounts)
  .post(protect, requirePermission("addBankAccount"), createBankAccount);

router
  .route("/:id/bank-accounts/:bankId")
  .put(protect, requirePermission("addBankAccount"), updateBankAccount)
  .delete(protect, requirePermission("addBankAccount"), deleteBankAccount);

// Member management routes
router
  .route("/:id/members")
  .get(protect, getMembers)
  .post(protect, requirePermission("addUser"), addMember);
router.route("/:id/members/me").get(protect, getMyMembership);
router
  .route("/:id/members/transfer-ownership")
  .post(protect, transferOwnership);
router
  .route("/:id/members/:memberId")
  .put(protect, updateMember)
  .delete(protect, removeMember);

// Account relationship routes
router.route("/:id/relationships").get(protect, getRelationships);
router
  .route("/:id/relationships/downward")
  .post(
    protect,
    requirePermission("createAccountDownward"),
    createDownwardAccount,
  );
router.route("/:id/relationships/upward").post(protect, linkUpwardAccount);
router.route("/:id/relationships/sideways").post(protect, linkSidewaysAccount);
router.route("/:id/relationships/:relId").delete(protect, removeRelationship);

// Pending invitations for an account
router.route("/:id/invitations").get(protect, getAccountInvitations);
router.route("/:id/invitations/:invId").delete(protect, cancelInvitation);

// Activity log
router.route("/:id/activity").get(protect, getActivityLog);

// Ownership transfer correction & status
router
  .route("/:id/ownership-correction")
  .post(protect, requestOwnershipCorrection);
router.route("/:id/ownership-transfer-status").get(protect, getTransferStatus);

export default router;
