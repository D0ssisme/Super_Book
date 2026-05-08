import User from '../models/User.js';
import {
  createSupplyReceiptService,
  getAllReceiptsByAdminId, getReceiptByIdService,
  updateSupplyReceiptService, updatePurchaseStatusService
} from '../services/ReceiptService.js';

// POST /receipt - tao phieu nhap
export async function createReceipt(req, res) {
  try {
    const {details, supplierId} = req.body;
    const receipt = await createSupplyReceiptService(req.user.id, supplierId, details);
    if (!receipt) {
      return res.status(400).send({message: 'Error creating Suplly Receipt'});
    }
    return res.status(200).json(receipt);
  }catch (err){
    res.status(400).send({message: err.message});
  }
}
// POST /receipt/me - lay danh sach phieu nhap cua admin dang dang nhap
export async function getAllReceipts(req, res) {
  try {
    const receipt = await getAllReceiptsByAdminId(req.user.id);
    if (!receipt) {
      return res.status(400).send({message: 'Error getting all receipts'});
    }
    return res.status(200).json(receipt);
  }catch (err){
    res.status(400).send({message: err.message});
  }
}
// PUT /receipt/:id - cap nhat phieu nhap (chi pending)
export async function updateReceipt(req, res) {
  try {
    const {supplierId,paymentStatus, supplyDate, details} = req.body;
    const receipt = await updateSupplyReceiptService(req.params.id, req.user.id, supplierId,paymentStatus, supplyDate, details);
    if (!receipt) {
      return res.status(400).send({message: 'Error updating receipt'});
    }
    return res.status(200).json(receipt);
  }catch (err){
    res.status(400).send({message: err.message});
  }
}
// GET /receipt/:id - lay chi tiet phieu nhap
export async function getReceiptById(req, res) {
  try {
    const receipt = getReceiptByIdService(req.params.id);
    if (!receipt) {
      return res.status(400).send({message: 'Error deleting receipt'});
    }
    return res.status(200).json(receipt);
  }catch (err){
    res.status(400).send({message: err.message});
  }
}
// PUT /receipt/status/:id - doi trang thai phieu
export async function updateStatus(req, res) {
  try {
    const {purchaseStatus} = req.body;
    const receipt = await updatePurchaseStatusService(req.params.id, req.user.id, purchaseStatus);
    if (!receipt) {
      return res.status(400).send({message: 'Update Purchase Status Failed'});
    }
    return res.status(200).json(receipt);
  }catch (err){
    res.status(400).send({message: err.message});
  }
}