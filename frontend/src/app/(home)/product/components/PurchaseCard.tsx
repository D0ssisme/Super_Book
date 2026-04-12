"use client";

import { useCartStore } from "@/stores/useCartStore";
import { MessageCircle, Share2, ShoppingCart, Tag } from "lucide-react";
import React, { useState } from "react";
import QuantityInput from "@/components/customer/QuantityInput";
import { toast } from "sonner";

interface Book {
  _id: string;
  name: string;
  price: number;
  quantity: number; // Số lượng tồn kho
  imageUrl?: string[];
  event?: {
    _id?: string;
    name?: string;
    discountPercent: number;
  } | null;
  // Các thuộc tính khác...
}

interface PurchaseCardProps {
  book: Book;
  initialQuantity?: number;
}

const PurchaseCard = ({ book, initialQuantity = 1 }: PurchaseCardProps) => {
  const addToCart = useCartStore((s) => s.addToCart);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const maxQuantity = Math.min(book.quantity, 99);
  const isOutOfStock = book.quantity <= 0;

  // Calculate discounted price if event exists
  const finalPrice = book.event
    ? Math.floor(book.price * (1 - book.event.discountPercent / 100))
    : book.price;
  const savings = book.price - finalPrice;

  // Quantity handlers
  const onIncrease = () => {
    setQuantity((prev) => Math.min(prev + 1, maxQuantity));
  };

  const onDecrease = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);

    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  const handleBlur = () => {
    if (quantity < 1) setQuantity(1);
    else if (quantity > maxQuantity) setQuantity(maxQuantity);
  };

  // Add to cart handler
  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    try {
      setIsAddingToCart(true);

      // Gọi hàm addToCart từ store
      await addToCart(book._id, quantity);
    } catch (error: any) {
      console.error("Error adding to cart:", error);

      if (error.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      } else if (error.response?.status === 400) {
        toast.error("Số lượng vượt quá tồn kho");
        if (error.response?.data?.availableQuantity) {
        }
      } else {
        toast.error("Không thể thêm vào giỏ hàng");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Buy now handler
  const handleBuyNow = async () => {
    if (isOutOfStock) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    try {
      setIsBuyingNow(true);

      await addToCart(book._id, quantity);
      setTimeout(() => {
        window.location.href = "/cart";
      }, 800);
    } catch (error: any) {
      console.error("Error in buy now:", error);

      if (error.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để mua hàng");
        // redirect đến trang login
        setTimeout(() => {
          window.location.href =
            "/login?redirect=" + encodeURIComponent(window.location.pathname);
        }, 1000);
      } else {
        toast.error("Không thể xử lý đơn hàng");
      }
    } finally {
      setIsBuyingNow(false);
    }
  };

  // Share handler
  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareText = `Mua sách "${
      book.name
    }" trên REBO Bookstore - Chỉ ${book.price.toLocaleString("vi-VN")}đ`;

    if (navigator.share) {
      navigator.share({
        title: book.name,
        text: shareText,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết!");
    }
  };

  // Call hotline
  const handleCallHotline = () => {
    if (window.confirm(`Gọi đến hotline 0972 430 690?`)) {
      window.location.href = "tel:0972430690";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-green-100 sticky top-6">
      <div className="space-y-4">
        {/* Event Badge */}
        {book.event && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              <Tag className="w-4 h-4" />-{book.event.discountPercent}%
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">
                {book.event.name}
              </p>
              <p className="text-xs text-gray-600">
                Tiết kiệm: {savings.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="pb-4 border-b border-green-100">
          <p className="text-sm text-gray-500 mb-1">Giá bán</p>
          <div className="flex items-end gap-3">
            {book.event ? (
              <>
                <p className="text-3xl font-bold text-red-600">
                  {finalPrice.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-sm line-through text-gray-400 pb-1">
                  {book.price.toLocaleString("vi-VN")}đ
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-green-700">
                {book.price.toLocaleString("vi-VN")}đ
              </p>
            )}
          </div>
        </div>

        {/* Stock Status */}
        <div
          className={`text-sm font-medium ${
            isOutOfStock ? "text-red-600" : "text-green-600"
          }`}
        >
          {isOutOfStock ? "Tạm hết hàng" : `Còn ${book.quantity} sản phẩm`}
        </div>

        {/* Quantity Input - chỉ hiển thị nếu còn hàng */}
        {!isOutOfStock && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Số lượng</p>
            <QuantityInput
              value={quantity}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              onChange={handleChange}
              onBlur={handleBlur}
              size="sm"
            />
            {quantity === maxQuantity && maxQuantity < 99 && (
              <p className="text-xs text-amber-600 mt-1">
                Bạn đã chọn tối đa số lượng có sẵn
              </p>
            )}
          </div>
        )}

        {/* Temporary Total */}
        {!isOutOfStock && (
          <div className="pt-4 border-t border-green-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Tạm tính:</span>
              <span className="text-2xl font-bold text-green-700">
                {(finalPrice * quantity).toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Buy Now Button */}
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock || isBuyingNow}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:hover:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl text-lg transition duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isBuyingNow ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ĐANG XỬ LÝ...
              </>
            ) : (
              "MUA NGAY"
            )}
          </button>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
            className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-white font-bold py-4 px-6 rounded-xl text-lg transition duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {isAddingToCart ? (
              <>
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ĐANG THÊM...
              </>
            ) : (
              <>
                <ShoppingCart size={22} />
                {isOutOfStock ? "HẾT HÀNG" : "THÊM VÀO GIỎ"}
              </>
            )}
          </button>
        </div>

        {/* Share Section */}
        <div className="border-t border-green-100 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-gray-700 font-medium">Chia sẻ</span>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition"
                aria-label="Chia sẻ sản phẩm"
                title="Chia sẻ sản phẩm"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Hotline */}
        <div className="border-t border-green-100 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCallHotline}
              className="bg-green-100 p-3 rounded-full hover:bg-green-200 transition"
              aria-label="Gọi hotline"
              title="Gọi đặt mua"
            >
              <MessageCircle className="text-green-600" size={24} />
            </button>
            <div>
              <p className="text-sm text-gray-600">Gọi đặt mua</p>
              <button
                onClick={handleCallHotline}
                className="text-xl font-bold text-gray-900 hover:text-green-700 transition"
              >
                0972 430 690
              </button>
              <p className="text-sm text-gray-500">(7:30 - 22:00)</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-green-100">
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Miễn phí vận chuyển từ 100k</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Đổi trả trong 7 ngày</span>
            </li>
            <li className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Thanh toán khi nhận hàng</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCard;
