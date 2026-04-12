"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PackageOpen, Eye, MapPin, Phone, User, CreditCard, BookOpen, ChevronLeft, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { getAllOrderByToken } from '@/services/PaymentService';
import { orderServices } from '@/services/orderServices';
import { Order, OrderDetail, OrderWithDetails } from '@/types/order.type';
import Image from "next/image";
import useSWR from 'swr';
import { reviewServices } from "@/services/reviewServices";
import { ReviewDetail } from "@/types/review.type";
import { toast } from "sonner";
import { ReviewFormDialog } from "@/components/review/ReviewFormDialog";

const REVIEWABLE_PURCHASE_STATUS = new Set(["completed"]);

const OrderItemReviewAction = ({
  orderId,
  bookId,
  bookName,
  purchaseStatus,
}: {
  orderId: string;
  bookId: string;
  bookName: string;
  purchaseStatus?: string;
}) => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
  const [isFetchingReview, setIsFetchingReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCheckReview = Boolean(bookId && orderId && REVIEWABLE_PURCHASE_STATUS.has(purchaseStatus || ""));

  const { data: reviewPermission, isLoading, mutate } = useSWR(
    canCheckReview ? ["review-can", orderId, bookId] : null,
    () => reviewServices.canReview(bookId, orderId)
  );

  if (!canCheckReview) {
    return null;
  }

  const handleCreateReview = async (payload: { rating: number; content: string; images: string[] }) => {
    try {
      setIsSubmitting(true);
      await reviewServices.createMyReview({
        bookId,
        orderId,
        rating: payload.rating,
        content: payload.content,
        images: payload.images,
      });
      toast.success("Đánh giá đã được gửi và đang chờ duyệt");
      setOpenCreate(false);
      await mutate();
    } catch (error) {
      toast.error("Không thể gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenView = async () => {
    if (!reviewPermission?.reviewId) return;
    try {
      setOpenView(true);
      setIsFetchingReview(true);
      const detail = await reviewServices.getMyReviewDetail(reviewPermission.reviewId);
      setSelectedReview(detail);
    } catch (error) {
      toast.error("Không thể tải chi tiết đánh giá");
      setOpenView(false);
    } finally {
      setIsFetchingReview(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Kiểm tra...
        </Button>
      ) : reviewPermission?.canReview ? (
        <Button variant="outline" size="sm" onClick={() => setOpenCreate(true)}>
          <MessageSquare className="w-4 h-4 mr-1" />
          Đánh giá
        </Button>
      ) : reviewPermission?.reviewId ? (
        <Button variant="ghost" size="sm" className="text-primary" onClick={handleOpenView}>
          <Eye className="w-4 h-4 mr-1" />
          Xem đánh giá
        </Button>
      ) : null}

      <ReviewFormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="Đánh giá sản phẩm"
        description={bookName}
        submitText="Gửi đánh giá"
        loading={isSubmitting}
        onUploadImages={reviewServices.uploadReviewImages}
        onSubmit={handleCreateReview}
      />

      <ReviewFormDialog
        open={openView}
        onOpenChange={(nextOpen) => {
          setOpenView(nextOpen);
          if (!nextOpen) {
            setSelectedReview(null);
          }
        }}
        title="Đánh giá của bạn"
        description={bookName}
        readOnly
        loading={isFetchingReview}
        initialValues={{
          rating: selectedReview?.rating,
          content: selectedReview?.content,
          images: selectedReview?.images,
          moderationNote: selectedReview?.moderationNote,
        }}
      />
    </>
  );
};

const OrderDetailList = ({ orderId }: { orderId: string }) => {
  const { data: order, isLoading } = useSWR<OrderWithDetails>(
    orderId ? [`/orders/${orderId}`] : null,
    () => orderServices.getOrderDetailById(orderId),
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) return <div className="text-center py-4 text-sm text-gray-500">Đang tải thông tin sách...</div>;

  const listBooks: OrderDetail[] = Array.isArray(order?.details) ? order.details : [];

  if (listBooks.length === 0) return <div className="text-center py-4 text-sm text-gray-500">Không có thông tin sản phẩm.</div>;

  return (
    <div className="space-y-3">
      {listBooks.map((item) => (
        <div key={item._id} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
          <div className="relative w-16 h-20 flex-shrink-0 border rounded-md overflow-hidden bg-gray-100">
            {item.bookImage ? (
              <Image src={item.bookImage} alt={item.bookName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <BookOpen size={20} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h5 className="font-medium text-sm text-gray-900 line-clamp-2" title={item.bookName}>
              {item.bookName}
            </h5>
            <div className="mt-1 flex justify-between items-center text-sm">
              <span className="text-gray-500">x{item.quantity}</span>
              <span className="font-medium text-primary">{formatCurrency(item.price)}</span>
            </div>
            <div className="text-xs text-right text-gray-400 mt-1">
              Tổng: {formatCurrency(item.total || (item.price * item.quantity))}
            </div>
            <div className="mt-2 flex justify-end">
              <OrderItemReviewAction
                orderId={orderId}
                bookId={item.bookId}
                bookName={item.bookName}
                purchaseStatus={order?.purchaseStatus}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 2. Component chính: OrdersTab ---
export function OrdersTab() {
  // STATE CHO PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const LIMIT = 5;

  const { order, isLoading } = getAllOrderByToken(currentPage, LIMIT, filterStatus);

  // Lấy data phân trang từ API trả về
  const pagination = order?.pagination || {
    currentPage: 1,
    totalItems: 0,
    totalPages: 1
  };

  // Helper formats
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: Date | string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return "N/A";
    }
  }

  const getOrderStyle = (status: string) => {
    if (status === "paid") return "border-green-500 bg-green-50/30 hover:bg-green-50/50";
    return "border-red-500 bg-red-50/30 hover:bg-red-50/50";
  };

  const renderStatusBadge = (status: string, type: 'payment' | 'purchase') => {
    if (type === 'payment') {
      return status === 'paid'
        ? <Badge className="bg-green-600 hover:bg-green-700">Đã thanh toán</Badge>
        : <Badge variant="destructive">Chưa thanh toán</Badge>;
    }
    const map: Record<string, any> = {
      pending: { label: 'Đang xử lý', color: 'bg-yellow-500' },
      canceled: { label: 'Đã hủy', color: 'bg-gray-500' },
      completed: { label: 'Hoàn thành', color: 'bg-blue-500' }
    };
    const info = map[status] || { label: status, color: 'bg-gray-500' };
    return <Badge className={`${info.color} hover:${info.color}`}>{info.label}</Badge>;
  };

  // Xử lý filter phía Client (Lưu ý: Nếu API hỗ trợ filter thì nên truyền param vào API luôn)
  const ordersList: Order[] = order?.data || [];

  const filteredOrders = ordersList.filter((item) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "PAID") return item.paymentStatus === "paid";
    if (filterStatus === "UNPAID") return item.paymentStatus === "unpaid";
    return true;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải lịch sử đơn hàng...</div>;
  }

  return (
    <Card className="border-none shadow-none bg-transparent lg:bg-white lg:border lg:shadow-sm">
      <CardHeader className="px-0 lg:px-6 pt-0 lg:pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Lịch sử đơn hàng</CardTitle>
            <CardDescription>
              Hiện có {pagination.totalItems} đơn hàng
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant={filterStatus === "ALL" ? "default" : "outline"} size="sm" onClick={() => setFilterStatus("ALL")}>Tất cả</Button>
            <Button variant={filterStatus === "PAID" ? "default" : "outline"} size="sm" className={filterStatus === "PAID" ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setFilterStatus("PAID")}>Đã thanh toán</Button>
            <Button variant={filterStatus === "UNPAID" ? "default" : "outline"} size="sm" className={filterStatus === "UNPAID" ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => setFilterStatus("UNPAID")}>Chưa thanh toán</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 lg:px-6 pb-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <PackageOpen className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Không tìm thấy đơn hàng</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order._id} className={`transition-all border-l-4 shadow-sm ${getOrderStyle(order.paymentStatus)}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">Đơn hàng #{order._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Phương thức: <span className="font-medium">{order.paymentMethod}</span>
                      </div>
                      <div className="text-sm font-medium pt-1">
                        Tổng tiền: <span className="text-primary text-base">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex gap-2">
                        {renderStatusBadge(order.purchaseStatus, 'purchase')}
                        {renderStatusBadge(order.paymentStatus, 'payment')}
                      </div>

                      {REVIEWABLE_PURCHASE_STATUS.has(order.purchaseStatus) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="mt-2 w-full sm:w-auto">
                              <MessageSquare className="w-4 h-4 mr-2" /> Đánh giá
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Đánh giá đơn hàng</DialogTitle>
                              <DialogDescription>
                                Chọn từng sản phẩm để đánh giá nhanh
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 p-4 bg-white rounded-lg border shadow-sm">
                              <h4 className="font-semibold flex items-center gap-2 text-sm text-gray-900 border-b pb-2">
                                <BookOpen className="w-4 h-4 text-blue-600" /> Sản phẩm có thể đánh giá
                              </h4>
                              <OrderDetailList orderId={order._id} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* DIALOG CHI TIẾT */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto">
                            <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                            <DialogDescription>
                              Mã đơn: #{order._id} - Ngày: {formatDate(order.purchaseDate)}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-4 py-2">
                            <div className="space-y-3 p-4 bg-white rounded-lg border shadow-sm">
                              <h4 className="font-semibold flex items-center gap-2 text-sm text-gray-900 border-b pb-2">
                                <BookOpen className="w-4 h-4 text-blue-600" /> Sản phẩm đã mua
                              </h4>
                              <OrderDetailList orderId={order._id} />
                              <div className="border-t pt-2 mt-2 flex justify-between items-center text-sm font-bold">
                                <span>Tổng cộng:</span>
                                <span className="text-primary text-lg">{formatCurrency(order.totalAmount)}</span>
                              </div>
                            </div>
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                              <h4 className="font-medium flex items-center gap-2 text-sm text-gray-900">
                                <User className="w-4 h-4" /> Thông tin nhận hàng
                              </h4>
                              <div className="grid grid-cols-[24px_1fr] gap-1 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{order.receiverName}</span>
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{order.receiverPhone}</span>
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{order.receiverAddress}</span>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* PHẦN PHÂN TRANG */}
      {pagination.totalPages > 1 && (
        <CardFooter className="flex justify-center py-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium px-4">
                    Trang {currentPage} / {pagination.totalPages}
                </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}