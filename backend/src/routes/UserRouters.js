import express from 'express';
import { auth } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from '../controllers/UserController.js';

const router = express.Router();



router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", auth, updateUser)
router.post("/", createUser)
router.delete("/:id", auth, deleteUser)


export default router;