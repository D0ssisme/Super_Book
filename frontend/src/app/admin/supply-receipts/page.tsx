"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, RefreshCw, Eye } from "lucide-react";
import Swal from "sweetalert2";
import { getAllSupplyReceipts, createSupplyReceipt, updateSupplyReceipt, updateSupplyReceiptStatus } from "@/api/supplreceiptApi";
import { getAllSuppliers } from "@/api/supplierApi";
import { getAllBooks } from "@/api/bookApi";
import SearchableSelect from "@/components/SearchableSelect";
import type { SupplyReceipt, SupplyItem } from "@/types/supplyreceipt.type";
import type { Supplier } from "@/types/supplier.type";
import type { Book } from "@/types/book.type";
import Pagination from "../components/Pagination";

export default function SupplyReceiptsPage() {
  const [receipts, setReceipts] = useState<SupplyReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplyReceipt | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [totalItems, setTotalItems] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    completed: 0,
    canceled: 0,
  });

  // Fetch data từ API
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await getAllSupplyReceipts(params);

      // Map dữ liệu từ backend sang frontend format
      const mappedReceipts = (response.data || []).map((r: any) => ({
        id: r._id,
        supplier_id: r.supplierId?._id || r.supplierId,
        supplier_name: r.supplierId?.name || "Không rõ",
        admin_id: r.adminId?._id || r.adminId,
        supply_date: r.supplyDate,
        supply_status: r.purchaseStatus,
        total_amount: r.totalAmount || 0,
        items: (r.details || []).map((d: any) => ({
          book_id: d.bookId?._id || d.bookId,
          book_name: d.bookId?.name || "Không rõ",
          import_price: d.importPrice,
          quantity: d.quantity,
          sub_amount: d.importPrice * d.quantity,
        })),
      }));

      setReceipts(mappedReceipts);
      setTotalItems(response.pagination?.total || mappedReceipts.length);

      // Fetch thống kê số lượng theo trạng thái
      const allResponse = await getAllSupplyReceipts({ limit: 1000 });
      const allReceipts = allResponse.data || [];
      setStatusCounts({
        all: allReceipts.length,
        pending: allReceipts.filter((r: any) => r.purchaseStatus === "pending").length,
        completed: allReceipts.filter((r: any) => r.purchaseStatus === "completed").length,
        canceled: allReceipts.filter((r: any) => r.purchaseStatus === "canceled").length,
      });
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await getAllSuppliers();
      const mappedSuppliers = (response.data || response || []).map((s: any) => ({
        id: s._id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
      }));
      setSuppliers(mappedSuppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await getAllBooks({ limit: 1000 });
      const mappedBooks = (response.data || response || []).map((b: any) => ({
        id: b._id,
        name: b.name,
        price: b.price,
      }));
      setBooks(mappedBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchBooks();
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [currentPage, itemsPerPage, statusFilter]);

  // Pagination đã được xử lý từ API
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isEditableStatus = (status?: string) => status === "pending";
  const canUpdateStatus = (status?: string) => status === "pending" || status === "completed";
  const isReadonlyEdit = Boolean(editing && !isEditableStatus(editing.supply_status));

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReceipt, setStatusReceipt] = useState<SupplyReceipt | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const [formData, setFormData] = useState<Omit<SupplyReceipt, "id" | "total_amount">>({
    supplier_id: "",
    admin_id: "",
    supply_date: new Date().toISOString().slice(0, 10),
    supply_status: "pending",
    items: [],
  });

  // Tính tổng tiền
  const calcTotal = (items: SupplyItem[]) =>
    items.reduce((sum, i) => sum + i.import_price * i.quantity, 0);

  // Mở modal
  const openModal = (receipt: SupplyReceipt | null = null) => {
    if (receipt) {
      setEditing(receipt);
      setFormData({
        supplier_id: receipt.supplier_id,
        admin_id: receipt.admin_id,
        supply_date: receipt.supply_date.slice(0, 10),
        // Form chi tiet khong cap nhat status, chi hien thong tin nhap hang.
        supply_status: receipt.supply_status,
        items: receipt.items,
      });
    } else {
      setEditing(null);
      setFormData({
        supplier_id: "",
        admin_id: "u1",
        supply_date: new Date().toISOString().slice(0, 10),
        // Tao moi luon mac dinh pending.
        supply_status: "pending",
        items: [],
      });
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      supplier_id: "",
      admin_id: "u1",
      supply_date: new Date().toISOString().slice(0, 10),
      supply_status: "pending",
      items: [],
    });
    setShowModal(false);
  };

  // Thêm dòng sản phẩm
  const addItem = () => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { book_id: "", import_price: 1000, quantity: 1, sub_amount: 1000 }],
    });
  };

  // Cập nhật dòng
  const updateItem = (index: number, field: keyof SupplyItem, value: any) => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    const newItems = [...formData.items];
    const updatedItem = { ...newItems[index], [field]: value };
    updatedItem.sub_amount = updatedItem.import_price * updatedItem.quantity;
    newItems[index] = updatedItem;
    setFormData({ ...formData, items: newItems });
  };

  // Xóa dòng sản phẩm
  const removeItem = (index: number) => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  // Lưu phiếu nhập
  const handleSubmit = async () => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    if (!formData.supplier_id || formData.items.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng chọn nhà cung cấp và thêm ít nhất 1 sản phẩm!",
      });
      return;
    }

    // Kiểm tra tất cả items có đủ thông tin
    for (const item of formData.items) {
      if (!item.book_id) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Vui lòng chọn sách cho tất cả sản phẩm!",
        });
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Số lượng phải lớn hơn 0!",
        });
        return;
      }
      if (!item.import_price || item.import_price <= 0) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Giá nhập phải lớn hơn 0!",
        });
        return;
      }
    }

    try {
      // Map dữ liệu sang format backend
      const apiData: any = {
        supplierId: formData.supplier_id,
        supplyDate: formData.supply_date,
        details: formData.items.map((item) => ({
          bookId: item.book_id,
          importPrice: item.import_price,
          quantity: item.quantity,
        })),
      };

      // Khong gui purchaseStatus khi tao/sua chi tiet, backend se mac dinh pending luc tao.

      console.log("Sending data:", apiData); // Debug

      if (editing) {
        await updateSupplyReceipt(editing.id, apiData);
      } else {
        await createSupplyReceipt(apiData);
      }

      resetForm();
      fetchReceipts();
    } catch (error: any) {
      console.error("Error saving receipt:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error?.response?.data?.message || "Có lỗi xảy ra khi lưu phiếu nhập!",
      });
    }
  };

  const openStatusUpdateModal = (receipt: SupplyReceipt) => {
    if (receipt.supply_status === "canceled") {
      Swal.fire({
        icon: "info",
        title: "Không thể cập nhật",
        text: "Phiếu đã hủy không thể đổi trạng thái nữa.",
      });
      return;
    }
    setStatusReceipt(receipt);
    setNewStatus("");
    setShowStatusModal(true);
  };

  const submitStatusUpdate = async () => {
    if (!statusReceipt || !newStatus) return;

    try {
      await updateSupplyReceiptStatus(statusReceipt.id, newStatus);

      if (editing?.id === statusReceipt.id) {
        setEditing((prev) => (prev ? { ...prev, supply_status: newStatus as SupplyReceipt["supply_status"] } : prev));
        setFormData((prev) => ({ ...prev, supply_status: newStatus as SupplyReceipt["supply_status"] }));
      }

      await fetchReceipts();
      setShowStatusModal(false);
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text:
          newStatus === "completed"
            ? "Đã xác nhận phiếu và cộng tồn kho thành công."
            : "Đã hủy phiếu nhập thành công.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error?.response?.data?.message || "Không thể cập nhật trạng thái phiếu nhập!",
      });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="bg-white border-l-4 border-teal-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">Quản lý phiếu nhập hàng</h2>
            <p className="text-gray-600 text-sm mt-1">Quản lý thông tin nhập hàng từ nhà cung cấp</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Thêm phiếu nhập
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "all"
                ? "bg-teal-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Tất cả <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.all}</span>
          </button>
          <button
            onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
          >
            Đang xử lý <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.pending}</span>
          </button>
          <button
            onClick={() => { setStatusFilter("completed"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "completed"
                ? "bg-teal-500 text-white shadow-md"
                : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
              }`}
          >
            Đã xác nhận <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.completed}</span>
          </button>
          <button
            onClick={() => { setStatusFilter("canceled"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "canceled"
                ? "bg-red-500 text-white shadow-md"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              }`}
          >
            Đã hủy <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.canceled}</span>
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Mã phiếu</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Nhà cung cấp</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Ngày nhập</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-gray-700 font-semibold text-sm">Tổng tiền</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Chưa có phiếu nhập nào 
                    </td>
                  </tr>
                ) : (
                  receipts.map((r: SupplyReceipt) => {
                    const supplierName = (r as any).supplier_name || suppliers.find((s: any) => s.id === r.supplier_id)?.name || "Không rõ";
                    return (
                      <tr key={r.id} className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200">
                        <td className="px-4 py-4 text-gray-800 font-medium">{r.id.slice(-8)}</td>
                        <td className="px-4 py-4 text-gray-600">{supplierName}</td>
                        <td className="px-4 py-4 text-gray-600">
                          {new Date(r.supply_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${r.supply_status === "completed"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : r.supply_status === "canceled"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                            {r.supply_status === "completed"
                              ? "Đã xác nhận"
                              : r.supply_status === "canceled"
                                ? "Đã hủy"
                                : "Đang xử lý"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-800 font-semibold">
                          {r.total_amount.toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openModal(r)}
                              className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200"
                              title={!isEditableStatus(r.supply_status) ? "Xem thông tin phiếu" : "Sửa phiếu"}
                            >
                              {!isEditableStatus(r.supply_status) ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <Pencil className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openStatusUpdateModal(r)}
                              disabled={!canUpdateStatus(r.supply_status)}
                              title={canUpdateStatus(r.supply_status) ? "Cập nhật trạng thái" : "Phiếu đã hủy"}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                !canUpdateStatus(r.supply_status)
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                              }`}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b-2 border-emerald-600">
              {editing ? (isReadonlyEdit ? "Xem thông tin phiếu nhập" : "Sửa phiếu nhập") : "Thêm phiếu nhập mới"}
            </h3>

            {/* Nhà cung cấp */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Nhà cung cấp *</label>
              <SearchableSelect
                value={formData.supplier_id}
                onChange={(value: string) => {
                  if (isReadonlyEdit) return;
                  setFormData({ ...formData, supplier_id: value });
                }}
                options={suppliers.map((s: any) => ({ _id: s.id, name: s.name }))}
                placeholder="Chọn nhà cung cấp"
                disabled={isReadonlyEdit}
              />
            </div>

            {/* Ngày nhập */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Ngày nhập *</label>
              <input
                type="date"
                value={formData.supply_date}
                onChange={(e) =>
                  setFormData({ ...formData, supply_date: e.target.value })
                }
                disabled={isReadonlyEdit}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Sản phẩm */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Chi tiết sản phẩm *</label>
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg">
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">Sách</label>
                      <SearchableSelect
                        value={item.book_id}
                        onChange={(value: string) =>
                          updateItem(index, "book_id", value)
                        }
                        options={books.map((b: any) => ({ _id: b.id, name: b.name }))}
                        placeholder="Chọn sách"
                        disabled={isReadonlyEdit}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value) || 0)
                        }
                        onFocus={(e) => e.target.select()}
                        disabled={isReadonlyEdit}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nhập SL"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Giá nhập</label>
                      <input
                        type="number"
                        min="1"
                        value={item.import_price || ""}
                        onChange={(e) =>
                          updateItem(index, "import_price", Number(e.target.value) || 0)
                        }
                        onFocus={(e) => e.target.select()}
                        disabled={isReadonlyEdit}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nhập giá"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">Thành tiền</label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800">
                        {item.sub_amount.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end justify-center pb-1">
                      <button
                        onClick={() => removeItem(index)}
                        disabled={isReadonlyEdit}
                        className={`p-2 rounded-lg transition-all duration-200 ${isReadonlyEdit ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                disabled={isReadonlyEdit}
                className={`mt-3 flex items-center gap-2 font-medium transition ${isReadonlyEdit ? "text-gray-400 cursor-not-allowed" : "text-emerald-700 hover:text-emerald-800"}`}
              >
                <Plus className="w-4 h-4" /> Thêm sản phẩm
              </button>
            </div>

            {/* Tổng tiền */}
            <div className="text-right text-gray-800 font-bold text-lg mb-4 pb-4 border-t border-gray-200 pt-4">
              Tổng tiền: {calcTotal(formData.items).toLocaleString("vi-VN")} ₫
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {isReadonlyEdit ? (
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  Đóng
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    {editing ? "Cập nhật" : "Thêm mới"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT TRẠNG THÁI */}
      {showStatusModal && statusReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Cập nhật trạng thái phiếu</h3>
            <p className="text-sm text-emerald-800 mb-5 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              Lưu ý: Chỉ khi đổi trạng thái sang <strong>Đã xác nhận</strong> thì tồn kho sách mới được cộng.
            </p>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Chọn trạng thái mới</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-800"
              >
                <option value="" disabled>-- Chọn trạng thái --</option>
                {statusReceipt.supply_status === "pending" && (
                  <>
                    <option value="completed">Đã xác nhận</option>
                    <option value="canceled">Đã hủy</option>
                  </>
                )}
                {statusReceipt.supply_status === "completed" && (
                  <option value="canceled">Đã hủy</option>
                )}
              </select>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium min-w-[100px] text-center"
              >
                Trở lại
              </button>
              <button
                onClick={submitStatusUpdate}
                disabled={!newStatus}
                className={`px-5 py-2.5 rounded-lg text-white transition-all font-medium min-w-[100px] text-center ${
                  !newStatus
                    ? "bg-emerald-400 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}