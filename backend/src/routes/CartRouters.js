import express from 'express';
import { addItem, clearCart, getCart, removeItem, updateQuantity, mergeCart } from '../controllers/CartController.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { auth } from '../middlewares/auth.js';
import { checkEmptyBody } from '../middlewares/checkEmptyBody.js';


const router = express.Router();

// Apply optional auth to most routes (allows guests)
router.use(optionalAuth)
router.use(checkEmptyBody)

router.get("/", getCart)
router.post("/", addItem);
router.put("/:id", updateQuantity) // :id = cartDetailId
router.delete("/:id", removeItem) // :id = cartDetailId
router.delete("/", clearCart)

// Merge guest cart to user cart (requires authentication)
router.post("/merge", auth, mergeCart);

export default router;
