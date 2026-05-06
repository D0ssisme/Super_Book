import Order from '../models/Order.js';
import Book from '../models/Book.js';
import SupplyReceipt from '../models/SupplyReceipt.js';
import SupplyDetail from '../models/SupplyDetail.js';

export async function createSupplyReceiptService(adminId, supplierId, details) {
  // Tính tổng tiền trước
  let totalAmount = 0;
  if (details && details.length > 0) {
    totalAmount = details.reduce((sum, item) => sum + (item.importPrice * item.quantity), 0);
  }

  const receipt = await SupplyReceipt.create({
    adminId: adminId || null,
    supplierId: supplierId,
    purchaseStatus: 'pending',
    totalAmount: totalAmount
  });
  if (details && details.length > 0) {
    await Promise.all(
      details.map(async item => {
          const book = await Book.findById(item.bookId);
          if (!book) {
            throw new Error(`Book with id ${item.bookId} not found`);
          }
          if (item.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
          }
          if (item.importPrice <= 0) {
            throw new Error('Import price must be greater than 0');
          }

          return await SupplyDetail.create({
            receiptId: receipt._id,
            bookId: book._id,
            quantity: item.quantity,
            importPrice: item.importPrice
          });
        }
      )
    );
  }
  const populatedReceipt = await SupplyReceipt.findById(receipt._id)
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  populatedReceipt.details = await SupplyDetail.find({ receiptId: receipt._id });
  return populatedReceipt;
}

export async function updateSupplyReceiptService(receiptId, adminId, supplierId, purchaseStatus, supplyDate, details) {
  const existingReceipt = await SupplyReceipt.findById(receiptId);
  if (!existingReceipt) {
    throw new Error(`Supply Receipt with id ${receiptId} not found`);
  }

  const oldStatus = existingReceipt.purchaseStatus?.toString() || 'pending';
  const nextStatus = (purchaseStatus || oldStatus).toString();
  const ALLOWED_STATUSES = ['pending', 'completed', 'canceled'];

  if (!ALLOWED_STATUSES.includes(nextStatus)) {
    throw new Error('Invalid purchase status');
  }

  // Khong cho doi trang thai trong API cap nhat chi tiet; chi doi status qua endpoint rieng.
  if (purchaseStatus && nextStatus !== oldStatus) {
    throw new Error('Status must be updated via status endpoint');
  }

  // Chỉ cho phép sửa phiếu khi phiếu còn pending để tránh sai lệch lịch sử nhập hàng.
  if (oldStatus !== 'pending') {
    throw new Error('Only pending receipts can be edited');
  }

  const oldDetailsDocs = await SupplyDetail.find({ receiptId: existingReceipt._id });
  const oldDetails = oldDetailsDocs.map((item) => ({
    bookId: item.bookId.toString(),
    quantity: item.quantity,
    importPrice: item.importPrice
  }));

  // details từ frontend modal luôn được truyền, fallback để an toàn với các client khác
  const incomingDetails = Array.isArray(details) ? details : oldDetails;
  if (Array.isArray(details) && details.length === 0) {
    throw new Error('Receipt must have at least one item');
  }

  const normalizedNewDetails = [];
  for (const item of incomingDetails) {
    if (!item.bookId) {
      throw new Error('Book is required for each receipt item');
    }
    if (item.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (item.importPrice <= 0) {
      throw new Error('Import price must be greater than 0');
    }

    const book = await Book.findById(item.bookId);
    if (!book) {
      throw new Error(`Book with id ${item.bookId} not found`);
    }

    normalizedNewDetails.push({
      receiptId: existingReceipt._id,
      bookId: book._id,
      quantity: item.quantity,
      importPrice: item.importPrice
    });
  }

  const totalAmount = normalizedNewDetails.reduce((sum, item) => sum + (item.importPrice * item.quantity), 0);

  const receipt = await SupplyReceipt.findByIdAndUpdate(
    receiptId,
    {
      adminId: adminId || undefined,
      supplierId: supplierId || existingReceipt.supplierId,
      purchaseStatus: nextStatus,
      supplyDate: supplyDate || existingReceipt.supplyDate,
      totalAmount: totalAmount
    },
    { new: true }
  );

  if (Array.isArray(details)) {
    await SupplyDetail.deleteMany({ receiptId: existingReceipt._id });
    if (normalizedNewDetails.length > 0) {
      await SupplyDetail.insertMany(normalizedNewDetails);
    }
  }

  const populatedReceipt = await SupplyReceipt.findById(receipt._id)
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  populatedReceipt.details = await SupplyDetail.find({ receiptId: receipt._id });
  return populatedReceipt;
}

export async function getAllReceiptsByAdminId(adminId) {
  const populatedReceipt = await Order.find({ adminId: adminId })
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  populatedReceipt.details = await SupplyDetail.find({ orderId: populatedReceipt._id });
  return populatedReceipt;
}

export async function getReceiptByIdService(receiptId) {
  const receipt = await Order.findById(receiptId)
    .populate('customerId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  if (!receipt) {
    throw new Error(`Supply Receipt with id ${receiptId} not found`);
  }
  receipt.details = await SupplyDetail.find({ orderId: receipt._id });
  return receipt;
}

export async function updatePurchaseStatusService(receiptId, adminId, purchaseStatus) {
  const receipt = await SupplyReceipt.findById(receiptId);
  if (!receipt) {
    throw new Error(`Supply Receipt with id ${receiptId} not found`);
  }

  const oldStatus = receipt.purchaseStatus?.toString() || 'pending';
  const nextStatus = (purchaseStatus || oldStatus).toString();
  const ALLOWED_TARGET_STATUSES = ['completed', 'canceled'];
  if (!ALLOWED_TARGET_STATUSES.includes(nextStatus)) {
    throw new Error('Invalid purchase status');
  }

  // Luong hop le: pending -> completed/canceled; completed/canceled la diem cuoi.
  const canTransition =
    oldStatus === 'pending' && (nextStatus === 'completed' || nextStatus === 'canceled');

  if (!canTransition) {
    throw new Error('Invalid status transition');
  }

  const supplyDetails = await SupplyDetail.find({ receiptId: receipt._id });
  if (supplyDetails.length === 0) {
    throw new Error(`Supply details not found`);
  }

  const qtyMap = new Map();
  for (const item of supplyDetails) {
    const key = item.bookId.toString();
    qtyMap.set(key, (qtyMap.get(key) || 0) + Number(item.quantity || 0));
  }

  // Chi cong ton kho khi xac nhan phieu nhap.
  const oldApplied = oldStatus === 'completed';
  const nextApplied = nextStatus === 'completed';

  if (!oldApplied && nextApplied) {
    for (const [bookId, qty] of qtyMap.entries()) {
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error(`Book with id ${bookId} not found`);
      }
      book.quantity = (book.quantity || 0) + qty;
      await book.save();
    }
  }

  receipt.purchaseStatus = nextStatus;
  receipt.adminId = adminId || receipt.adminId;
  await receipt.save();
  return receipt;
}