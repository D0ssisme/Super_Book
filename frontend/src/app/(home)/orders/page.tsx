"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import OrderItem from "@/components/order/OrderItem";
import { AddressSelectionDialog } from "@/components/order/AddressSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
  CreditCard,
  MapPin,
  Package,
  QrCode,
  Wallet,
} from "lucide-react";
import { getAllAddress } from "@/services/addressservices";
import { DialogCancelPayment } from "@/components/payment/DialogCancelPayment";
import { formatPrice } from "@/lib/utils";
import {
  ItemCart,
  OrderPayload,
  OrderPayloadSchema,
} from "@/validation/orderSchema";
import { Address } from "@/types/address.type";
import { Badge } from "@/components/ui/badge";
import { CreateAddressModal } from "@/components/address/create-address-modal";
import { useCartStore } from "@/stores/useCartStore";
import { toast } from "sonner";
import { Order } from "@/types/order.type";
import { orderServices } from "@/services/orderServices";
import { createPayment } from "@/services/PaymentService";
import { useUser } from "@/services/authservices";
import { validateCoupon } from "@/services/couponService";
import { useAuthDialog } from "@/components/auth-dialog-context";


const getLastAddressStorageKey = (userId?: string) =>
  userId ? `last_checkout_address_${userId}` : "last_checkout_address_guest";

const OrderPage = () => {
  const router = useRouter();
  const { setOpen: setAuthDialogOpen, setMode: setAuthDialogMode } = useAuthDialog();

  const { addresses, isLoading: addressLoading, mutate } = getAllAddress();
  const cart = useCartStore((s) => s.cart);
  const checkoutItems = useCartStore((s) => s.checkoutItems);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const cartLoading = useCartStore((s) => s.loading);
  const { user, isLoading: userLoading } = useUser();

  const [openCancel, setOpenCancel] = useState(false);
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [openCreateAddress, setOpenCreateAddress] = useState(false);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Auto-open auth dialog when user tries to checkout without login
  useEffect(() => {
    if (!userLoading && !user) {
      setAuthDialogMode('login');
      setAuthDialogOpen(true);
    }
  }, [user, userLoading, setAuthDialogOpen, setAuthDialogMode]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OrderPayload>({
    resolver: zodResolver(OrderPayloadSchema),
    defaultValues: {
      details: [],
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      paymentMethod: "COD",
    },
  });
  const receiverName = watch("receiverName");
  const receiverPhone = watch("receiverPhone");
  const receiverAddress = watch("receiverAddress");
  useEffect(() => {
    if (cart && cart.items.length > 0) {
      // Filter items to only include selected ones for checkout
      const itemsToCheckout =
        checkoutItems && checkoutItems.length > 0
          ? cart.items.filter((item) => checkoutItems.includes(item._id))
          : cart.items;

      const formItems: ItemCart[] = itemsToCheckout.map((item) => ({
        bookId: item.bookId,
        quantity: item.quantity,
        price: item.price,
      }));
      setValue("details", formItems, { shouldValidate: true });
    } else if (cart && cart.items.length === 0) {
      router.push("/");
    }
  }, [cart, checkoutItems, setValue, router]);
  useEffect(() => {
    if (addresses && addresses.length > 0 && !getValues("receiverName")) {
      const storageKey = getLastAddressStorageKey(user?.data?._id);
      const lastSelectedAddressId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(storageKey)
          : null;

      const lastSelectedAddr = lastSelectedAddressId
        ? addresses.find((addr: Address) => addr._id === lastSelectedAddressId)
        : null;

      const defaultAddr =
        lastSelectedAddr ||
        addresses.find((addr: Address) => addr.isDefault) ||
        addresses[0];

      if (defaultAddr) {
        fillAddressToForm(defaultAddr);
      }
    }
  }, [addresses, setValue, getValues, user?.data?._id]);

  useEffect(() => {
    const profile = user?.data;
    if (!profile) return;

    if (!getValues("receiverName") && profile.fullName) {
      setValue("receiverName", profile.fullName, { shouldValidate: true });
    }
    if (!getValues("receiverPhone") && profile.phone) {
      setValue("receiverPhone", profile.phone, { shouldValidate: true });
    }
  }, [user, getValues, setValue]);

  const fillAddressToForm = (addr: Address) => {
    const fullAddress = `${addr.detail}, ${addr.district}, ${addr.province}`;
    const profile = user?.data;

    setValue("receiverName", profile?.fullName || addr.name, {
      shouldValidate: true,
    });
    setValue("receiverPhone", profile?.phone || addr.phone, {
      shouldValidate: true,
    });
    setValue("receiverAddress", fullAddress, { shouldValidate: true });
    setIsDefaultAddress(Boolean(addr.isDefault));
  };

  const handleSelectAddress = (addr: Address) => {
    if (addr._id && typeof window !== "undefined") {
      window.localStorage.setItem(
        getLastAddressStorageKey(user?.data?._id),
        addr._id,
      );
    }
    fillAddressToForm(addr);
    setOpenAddressDialog(false);
  };

  const handleSuccessCreateAddr = async (addr: Address) => {
    setOpenCreateAddress(false);
    await mutate();
    if (addr._id && typeof window !== "undefined") {
      window.localStorage.setItem(
        getLastAddressStorageKey(user?.data?._id),
        addr._id,
      );
    }
    fillAddressToForm(addr);
  };

  const onSubmit = async (data: OrderPayload) => {
    try {
      if (data.paymentMethod === "CARD") {
        toast.info(
          "Chức năng chưa được hỗ trợ. Vui lòng chọn phương thức thanh toán khác!",
        );
        return;
      }
      const payload: OrderPayload = {
        ...data,
        couponCode: appliedCouponCode || undefined,
      };
      const res: Order = await orderServices.createOrder(payload);
      if (res.paymentMethod === "MOMO") {
        const paymentRes = await createPayment(res._id);
        if (!paymentRes?.ok) {
          const errorMessage =
            paymentRes && "message" in paymentRes
              ? paymentRes.message
              : "Không thể tạo thanh toán MoMo";
          toast.error(errorMessage);
          return;
        }
        const isMobile =
          typeof navigator !== "undefined" &&
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const paymentUrl = isMobile
          ? paymentRes?.payment?.deeplink || paymentRes?.payment?.paymentUrl
          : paymentRes?.payment?.paymentUrl || paymentRes?.payment?.deeplink;
        const qrCodeUrl = paymentRes?.payment?.qrCodeUrl;
        if (!paymentUrl) {
          if (qrCodeUrl) {
            toast.info(
              "MoMo đang tạm lỗi, hệ thống chuyển sang thanh toán QR chuyển khoản.",
            );
            router.push(`/payment/transfer/${res._id}`);
            return;
          }
          toast.error("Không tạo được link thanh toán MoMo");
          return;
        }
        toast.success("Đang chuyển sang cổng thanh toán MoMo...");
        window.location.href = paymentUrl;
        return;
      } else if (res.paymentMethod === "PAYOS") {
        const paymentRes = await createPayment(res._id);
        if (!paymentRes?.ok) {
          const errorMessage =
            paymentRes && "message" in paymentRes
              ? paymentRes.message
              : "Không thể tạo thanh toán";
          toast.error(errorMessage);
          return;
        }
        toast.success("Vui lòng quét mã QR để thanh toán.");
        router.push(`/payment/transfer/${res._id}`);
      } else if (res.paymentMethod === "COD") {
        router.push(`/orders/${res._id}`);
        toast.success("Đặt hàng thành công!");
      }
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra khi tạo đơn hàng";
      toast.error(message);
    }
  };

  if ((!cart && cartLoading) || addressLoading)
    return <div className="text-center p-10">Loading...</div>;
  
  // If not authenticated, auth dialog will open globally via useEffect
  // No need to show anything here
  if (!user) {
    return null;
  }

  if (!cart) return null;

  // Filter items to only show selected ones for checkout
  const displayItems =
    checkoutItems && checkoutItems.length > 0
      ? cart.items.filter((item) => checkoutItems.includes(item._id))
      : cart.items;

  // Calculate total for displayed items only
  const displayTotal = displayItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const finalTotal = Math.max(0, displayTotal - discountAmount);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const response = await validateCoupon(code, displayTotal);
      if (!response?.ok || !response?.coupon) {
        toast.error("Mã giảm giá không hợp lệ");
        return;
      }

      setAppliedCouponCode(response.coupon.code);
      setDiscountAmount(response.coupon.discountAmount || 0);
      toast.success(
        `Áp mã thành công, giảm ${formatPrice(response.coupon.discountAmount || 0)}`,
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Không áp dụng được mã giảm giá";
      toast.error(message);
      setAppliedCouponCode("");
      setDiscountAmount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCouponCode("");
    setDiscountAmount(0);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenCancel(true)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <DialogCancelPayment
            open={openCancel}
            onOpenChange={setOpenCancel}
            onConfirm={() => router.push("/")}
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Thanh toán đơn hàng
          </h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, (err) => console.log(err))}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative"
        >
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Address Section */}
            <Card
              className={`border-none shadow-sm ring-1 ${errors.receiverName ? "ring-red-500" : "ring-gray-200"}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" /> Địa chỉ nhận hàng
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenAddressDialog(true)}
                  className="text-blue-600 h-8 font-medium"
                >
                  {receiverName ? "Thay đổi" : "Chọn địa chỉ"}
                </Button>
              </CardHeader>
              <CardContent>
                {/* Logic hiển thị: Dựa vào field watch được từ form */}
                {receiverName ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <span>{receiverName}</span>
                      <span className="w-[1px] h-4 bg-gray-300"></span>
                      <span>{receiverPhone}</span>
                      {isDefaultAddress && (
                        <>
                          <span className="w-[1px] h-4 bg-gray-300"></span>
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-100"
                          >
                            Mặc định
                          </Badge>
                        </>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm">{receiverAddress}</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded text-center">
                    Vui lòng chọn địa chỉ để giao hàng
                  </div>
                )}

                {/* Hiển thị lỗi nếu thiếu 1 trong các trường */}
                {(errors.receiverName || errors.receiverAddress) && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    ⚠️ Vui lòng chọn địa chỉ nhận hàng đầy đủ.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 2. Order Details Section */}
            <Card className="border-none shadow-sm ring-1 ring-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" /> Chi tiết đơn
                  hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 divide-y">
                {errors.details && (
                  <p className="text-red-500 text-sm font-medium px-2">
                    {errors.details.message}
                  </p>
                )}

                {displayItems.map((item) => (
                  <div key={item._id} className="pt-4 first:pt-0">
                    <OrderItem
                      bookId={item.bookId}
                      quantity={item.quantity}
                      price={item.price}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              {/* Payment Method */}
              <Card className="border-none shadow-sm ring-1 ring-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" /> Phương thức
                    thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid gap-3"
                      >
                        <PaymentOption
                          value="COD"
                          label="Thanh toán khi nhận hàng (COD)"
                          icon={
                            <Banknote className="text-orange-600 w-5 h-5" />
                          }
                          selected={field.value}
                        />
                        <PaymentOption
                          value="MOMO"
                          label="Thanh toán MoMo"
                          icon={<QrCode className="text-green-600 w-5 h-5" />}
                          selected={field.value}
                        />
                        <PaymentOption
                          value="CARD"
                          label="Thẻ tín dụng / Ghi nợ"
                          icon={
                            <CreditCard className="text-indigo-600 w-5 h-5" />
                          }
                          selected={field.value}
                        />
                      </RadioGroup>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Total & Submit */}
              <Card className="border-none shadow-md ring-1 ring-gray-200 overflow-hidden">
                <div className="bg-gray-900 text-white p-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Wallet className="w-5 h-5" /> Tổng cộng
                  </h3>
                </div>
                <CardContent className="p-4 space-y-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Tạm tính:</span>
                      <span>{formatPrice(displayTotal)}</span>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder="Nhập mã giảm giá"
                          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon}
                        >
                          {isApplyingCoupon ? "Đang áp..." : "Áp mã"}
                        </Button>
                      </div>
                      {appliedCouponCode && (
                        <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
                          <span>
                            Đã áp mã <strong>{appliedCouponCode}</strong>
                          </span>
                          <button
                            type="button"
                            className="font-semibold underline"
                            onClick={handleRemoveCoupon}
                          >
                            Bỏ mã
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Giảm giá:</span>
                      <span className="text-green-600 font-medium">
                        -{formatPrice(discountAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Vận chuyển:</span>
                      <span className="text-green-600 font-medium">
                        Miễn phí
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-end pt-1">
                      <span className="font-bold text-base text-gray-900">
                        Tổng thanh toán:
                      </span>
                      <span className="font-bold text-2xl text-red-600">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold bg-red-600 hover:bg-red-700 shadow-sm mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Thanh toán ngay"}
                  </Button>
                </CardContent>
              </Card>

              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Cam kết bảo mật thanh toán. <br /> Hoàn tiền nếu có lỗi giao
                  dịch.
                </p>
              </div>
            </div>
          </div>
        </form>

        <AddressSelectionDialog
          open={openAddressDialog}
          onOpenChange={setOpenAddressDialog}
          onSelect={handleSelectAddress}
          onAddNew={() => setOpenCreateAddress(true)}
        />
        {openCreateAddress && (
          <CreateAddressModal
            isOpen={openCreateAddress}
            onClose={() => setOpenCreateAddress(false)}
            initialData={null}
            onSuccess={handleSuccessCreateAddr}
          />
        )}
      </div>
    </div>
  );
};

const PaymentOption = ({
  value,
  label,
  icon,
  selected,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  selected: string;
}) => (
  <div
    className={`relative flex items-center justify-between space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${selected === value ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"}`}
  >
    <div className="flex items-center space-x-3 w-full">
      <RadioGroupItem value={value} id={value} />
      <label
        htmlFor={value}
        className="cursor-pointer flex-1 flex items-center gap-2"
      >
        {icon}{" "}
        <span className="font-medium text-gray-900 text-sm">{label}</span>
      </label>
    </div>
  </div>
);

export default OrderPage;
