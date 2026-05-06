import express from 'express';
import { auth } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import { createUser, deleteUser, getAllUsers, getUserById, updateUser, lockUser, unlockUser } from '../controllers/UserController.js';

const router = express.Router();



router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", auth, updateUser)
router.post("/", createUser)
router.delete("/:id", auth, deleteUser)
router.put("/:id/lock", auth, authorizeRoles('admin'), lockUser)
router.put("/:id/unlock", auth, authorizeRoles('admin'), unlockUser)


export default router;