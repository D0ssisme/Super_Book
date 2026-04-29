import express from 'express';
import { auth } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  updateReceipt,
  updateStatus
} from '../controllers/ReceiptController.js';
import { checkEmptyBody } from '../middlewares/checkEmptyBody.js';


const router = express.Router();

router.use(auth);
router.use(authorizeRoles("admin"));
router.use(checkEmptyBody)

router.get('/:id', getReceiptById);
router.post('/', createReceipt);
router.post('/me', getAllReceipts);
router.put('/:id', updateReceipt);
router.put('/status/:id', updateStatus);

export default router;