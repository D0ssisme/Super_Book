"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Copy, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  cancelPayment,
  confirmPayment,
  createPayment,
  QrPaymentInfo,
} from "@/services/PaymentService";
import { orderServices } from "@/services/orderServices";
import { formatPrice } from "@/lib/utils";
import { useProductDeletionMonitor } from "@/hooks/useProductDeletionMonitor";

export default function TransferPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<QrPaymentInfo | null>(null);
  const [isCanceled, setIsCanceled] = useState(false);

  // Monitor for deleted products during payment
  useProductDeletionMonitor();

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await createPayment(id);
        if (!res?.ok) {
          toast.error((res as { message?: string })?.message || "Không thể tạo thông tin thanh toán QR");
          return;
        }
        if (!res.payment) {
          toast.error("Không thể tạo thông tin thanh toán QR");
          return;
        }
        setPayment(res.payment);
      } catch (error) {
        toast.error("Không thể tạo thông tin thanh toán QR");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id]);

  useEffect(() => {
    if (!payment?.orderId) return;

    let cancelled = false;
    // Poll trang thai don de chan thao tac neu don tu huy.
    const intervalId = setInterval(async () => {
      try {
        const order = await orderServices.getOrderDetailById(payment.orderId);
        if (order?.purchaseStatus === "canceled") {
          if (!cancelled) {
            setIsCanceled(true);
            toast.error("Đơn hàng đã bị hủy tự động. Vui lòng tạo đơn mới.");
          }
          cancelled = true;
          clearInterval(intervalId);
        }
      } catch {
        // Ignore polling errors to avoid spam
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [payment?.orderId]);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleConfirmPaid = async () => {
    if (!payment) return;
    if (isCanceled) {
      toast.error("Đơn hàng đã bị hủy, không thể thanh toán.");
      return;
    }
    try {
      setSubmitting(true);
      await confirmPayment(payment.orderId);
      toast.success("Đã xác nhận thanh toán thành công");
      router.push(`/orders/${payment.orderId}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Xác nhận thanh toán thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!payment) return;
    if (isCanceled) {
      toast.error("Đơn hàng đã bị hủy, không thể thao tác.");
      return;
    }
    try {
      setSubmitting(true);
      await cancelPayment(payment.orderId);
      toast.success("Đã hủy thanh toán");
      router.push(`/orders/${payment.orderId}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Hủy thanh toán thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-gray-700 font-medium">
              Không có dữ liệu thanh toán QR
            </p>
            <Button onClick={() => router.push("/")}>Về trang chủ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (payment.alreadyPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" />
            <h2 className="text-xl font-bold">Đơn hàng đã được thanh toán</h2>
            <Button onClick={() => router.push(`/orders/${payment.orderId}`)}>
              Xem chi tiết đơn hàng
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isCanceled ? (
          <Card className="lg:col-span-2 border-red-200 bg-red-50">
            <CardContent className="py-4 flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">
                Đơn hàng đã bị hủy tự động do quá hạn thanh toán.
              </span>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Quét mã QR để chuyển khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white border rounded-lg p-4 flex justify-center">

              {payment.qrCodeUrl ? (
                <Image
                  src={payment.qrCodeUrl}
                  alt="QR chuyển khoản"
                  width={320}
                  height={320}
                  className="w-full max-w-xs h-auto"
                />
              ) : (
                <p className="text-sm text-gray-500">Không có mã QR để hiển thị</p>
              )}

            </div>
            <p className="text-sm text-gray-600 text-center">
              Nội dung chuyển khoản phải chính xác để hệ thống xác nhận nhanh
              hơn.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin chuyển khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              label="Ngân hàng"
              value={`${payment.bank.bankBin}`}
              onCopy={() => handleCopy(payment.bank.bankBin, "mã ngân hàng")}
            />
            <InfoRow
              label="Số tài khoản"
              value={payment.bank.accountNumber}
              onCopy={() =>
                handleCopy(payment.bank.accountNumber, "số tài khoản")
              }
            />
            <InfoRow
              label="Chủ tài khoản"
              value={payment.bank.accountName}
              onCopy={() =>
                handleCopy(payment.bank.accountName, "tên chủ tài khoản")
              }
            />
            <InfoRow
              label="Số tiền"
              value={formatPrice(payment.amount)}
              onCopy={() => handleCopy(String(payment.amount), "số tiền")}
            />
            <InfoRow
              label="Nội dung"
              value={payment.transferContent}
              onCopy={() =>
                handleCopy(payment.transferContent, "nội dung chuyển khoản")
              }
            />

            <Separator />

            <div className="grid grid-cols-1 gap-3">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConfirmPaid}
                disabled={submitting || isCanceled}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Tôi đã chuyển khoản
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-600"
                onClick={handleCancel}
                disabled={submitting || isCanceled}
              >
                <XCircle className="w-4 h-4 mr-2" /> Hủy thanh toán
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm break-all">{value}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
