"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PackageOpen,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAllOrderByToken } from "@/services/PaymentService";
import { Order } from "@/types/order.type";

// --- 2. Component chính: OrdersTab ---
export function OrdersTab() {
  const router = useRouter();
  // STATE CHO PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PAID" | "UNPAID">(
    "ALL",
  );
  const LIMIT = 5;

  const { order, isLoading, error } = getAllOrderByToken(
    currentPage,
    LIMIT,
    filterStatus,
  );

  // Lấy data phân trang từ API trả về
  const pagination = order?.pagination || {
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
  };

  // Helper formats
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: Date | string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const getOrderStyle = (status: string) => {
    if (status === "paid")
      return "border-green-500 bg-green-50/30 hover:bg-green-50/50";
    return "border-red-500 bg-red-50/30 hover:bg-red-50/50";
  };

  const renderStatusBadge = (status: string, type: "payment" | "purchase") => {
    if (type === "payment") {
      return status === "paid" ? (
        <Badge className="bg-green-600 hover:bg-green-700">Đã thanh toán</Badge>
      ) : (
        <Badge variant="destructive">Chưa thanh toán</Badge>
      );
    }
    const map: Record<string, any> = {
      pending: { label: "Đang xử lý", color: "bg-yellow-500" },
      canceled: { label: "Đã hủy", color: "bg-gray-500" },
      completed: { label: "Hoàn thành", color: "bg-blue-500" },
    };
    const info = map[status] || { label: status, color: "bg-gray-500" };
    return (
      <Badge className={`${info.color} hover:${info.color}`}>
        {info.label}
      </Badge>
    );
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
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải lịch sử đơn hàng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Không tải được lịch sử đơn hàng. Vui lòng đăng nhập lại và thử lại.
      </div>
    );
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
            <Button
              variant={filterStatus === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("ALL")}
            >
              Tất cả
            </Button>
            <Button
              variant={filterStatus === "PAID" ? "default" : "outline"}
              size="sm"
              className={
                filterStatus === "PAID" ? "bg-green-600 hover:bg-green-700" : ""
              }
              onClick={() => setFilterStatus("PAID")}
            >
              Đã thanh toán
            </Button>
            <Button
              variant={filterStatus === "UNPAID" ? "default" : "outline"}
              size="sm"
              className={
                filterStatus === "UNPAID" ? "bg-red-600 hover:bg-red-700" : ""
              }
              onClick={() => setFilterStatus("UNPAID")}
            >
              Chưa thanh toán
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 lg:px-6 pb-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <PackageOpen className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Không tìm thấy đơn hàng
            </h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card
                key={order._id}
                className={`transition-all border-l-4 shadow-sm ${getOrderStyle(order.paymentStatus)}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          Đơn hàng #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Phương thức:{" "}
                        <span className="font-medium">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <div className="text-sm font-medium pt-1">
                        Tổng tiền:{" "}
                        <span className="text-primary text-base">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex gap-2">
                        {renderStatusBadge(order.purchaseStatus, "purchase")}
                        {renderStatusBadge(order.paymentStatus, "payment")}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full sm:w-auto"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                      </Button>
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
