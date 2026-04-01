"use client";

import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/useCartStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

const CartSummary = () => {
  const router = useRouter();
  const cart = useCartStore(s => s.cart);
  const selectedItemIds = useCartStore(s => s.selectedItemIds);
  const setCheckoutItems = useCartStore(s => s.setCheckoutItems);
  const [loading, setLoading] = useState(false);

  // Calculate total only for selected items
  const selectedTotal = cart?.items?.reduce((sum, item) => {
    if (selectedItemIds.includes(item._id)) {
      return sum + (item.price * item.quantity);
    }
    return sum;
  }, 0) ?? 0;

  const selectedCount = selectedItemIds.length;

  const handleGoToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Giỏ hàng đang trống!');
      return;
    }
    if (selectedCount === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm!');
      return;
    }
    
    setLoading(true);
    // Store selected items before navigation
    setCheckoutItems(selectedItemIds);
    router.push('/orders');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 h-fit my-auto">
      <h3 className="text-xl lg:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-4">
        Thông tin đơn hàng
      </h3>

      {/* Selected Items Info */}
      <div className="text-sm mb-4 pb-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-gray-700">Sản phẩm đã chọn:</h3>
        <h3 className="font-semibold text-green-600">{selectedCount}/{cart?.items?.length ?? 0}</h3>
      </div>

      <div className="text-lg mb-4 border-b border-gray-200 pb-4 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Tổng tiền:</h3>
        <h3 className="text-red-600 font-bold text-xl">{formatPrice(selectedTotal)}</h3>
      </div>

      <p className="text-gray-500 text-sm mb-6">Phí vận chuyển sẽ được tính ở bước tiếp theo.</p>

      <button
        onClick={handleGoToCheckout}
        disabled={loading || !cart || cart.items.length === 0 || selectedCount === 0}
        className={`bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 
          p-4 text-white font-semibold w-full rounded-xl mt-4 transition-all duration-300 
          transform hover:scale-[1.02] shadow-lg hover:shadow-xl cursor-pointer flex justify-center items-center
          ${loading || selectedCount === 0 ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {loading ? "Đang xử lý..." : "đặt hàng"}
      </button>
    </div>
  )
}

export default CartSummary