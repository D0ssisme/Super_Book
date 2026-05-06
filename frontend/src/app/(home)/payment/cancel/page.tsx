"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useProductDeletionMonitor } from "@/hooks/useProductDeletionMonitor";

const PaymentCancelContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Monitor for deleted products during payment
  useProductDeletionMonitor();

  const orderCode = searchParams.get("orderCode");
  const orderId = searchParams.get("orderId");
  // reason/message tra ve tu backend de hien thong bao dung tinh huong.
  const reason = searchParams.get("reason");
  const message = searchParams.get("message");
  const hasOrderCode = Boolean(orderCode || orderId);

  const isAutoCanceled = reason === "ORDER_CANCELED";
  const headerText = isAutoCanceled
    ? "Đơn đã bị hủy tự động"
    : "Thanh toán thất bại";
  const descriptionText = isAutoCanceled
    ? "Đơn hàng đã quá thời gian thanh toán. Nếu bạn đã thanh toán, vui lòng liên hệ để được hỗ trợ hoàn tiền."
    : "Giao dịch chưa hoàn tất. Bạn có thể quay lại đơn hàng để thanh toán lại.";
  const statusText = isAutoCanceled ? "Đơn đã bị hủy" : "Thanh toán thất bại";
  const noteText = isAutoCanceled
    ? "*Nếu bạn đã thanh toán, vui lòng liên hệ admin để được xử lý hoàn tiền."
    : "*Bạn chưa bị trừ tiền cho giao dịch này.";

  if (!hasOrderCode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-none shadow-xl">
        <CardHeader className="flex flex-col items-center space-y-2 pb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
            <AlertCircle className="w-20 h-20 text-red-500 relative z-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 text-center mt-4">
            {headerText}
          </CardTitle>
          <p className="text-gray-500 text-sm text-center max-w-xs">
            {message || descriptionText}
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-bold text-gray-900">
                #{orderCode || orderId}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trạng thái:</span>
              <span className="font-bold text-red-600">{statusText}</span>
            </div>
            <div className="text-xs text-red-500 mt-2 italic">
              {noteText}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          {orderId ? (
            <Button
              className="w-full"
              onClick={() => router.push(`/orders/${orderId}`)}
            >
              Thanh toán lại
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="w-full border-gray-300"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Về trang chủ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const PaymentCancelPage = () => (
  <Suspense
    fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    }
  >
    <PaymentCancelContent />
  </Suspense>
);

export default PaymentCancelPage;
