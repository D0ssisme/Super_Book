import api from "@/lib/axios";
import useSWR from "swr";
import { Order } from "@/types/order.type";
import { baseUrl } from "@/constants";

export interface QrPaymentInfo {
  orderId: string;
  orderCode: number | string;
  amount: number;
  qrCodeUrl?: string;
  paymentUrl?: string;
  deeplink?: string;
  transferContent: string;
  bank: {
    bankBin: string;
    accountNumber: string;
    accountName: string;
  };
  alreadyPaid?: boolean;
  message?: string;
}

export async function createPayment(id: string) {
  try {
    return await api
      .post(`/payment/create/${id}`)
      .then((res) => res.data as { ok: boolean; payment: QrPaymentInfo });
  } catch (error: any) {
    const message =
      error?.response?.data?.message || "Không thể tạo thanh toán";
    return { ok: false, message } as {
      ok: false;
      message: string;
      payment?: QrPaymentInfo;
    };
  }
}
export async function cancelPayment(id: string) {
  return await api.put(`/payment/cancel/${id}`).then((res) => res.data);
}
export async function confirmPayment(id: string) {
  return await api
    .put(`/payment/confirm/${id}`)
    .then((res) => res.data as Order);
}
export function getAllOrderByToken(
  page: number,
  limit: number,
  status: string,
) {
  // Xử lý logic: Nếu là ALL thì gửi chuỗi rỗng để Backend không lọc
  const statusParam = status === "ALL" ? "" : status;
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: statusParam,
  }).toString();

  const key = `${baseUrl}/orders/me/?${queryString}`;
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    api.get(`/orders/me/?${queryString}`).then((res) => res.data),
  );

  return {
    order: data,
    error,
    isLoading,
    mutate,
  };
}

export async function getOrderByOrderCode(orderCode: string) {
  return await api
    .get(`/orders/code?orderCode=${orderCode}`)
    .then((res) => res.data);
}
