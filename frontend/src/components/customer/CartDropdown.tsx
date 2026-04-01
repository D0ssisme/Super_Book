"use client";

import React, { useState, useRef, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

interface CartDropdownProps {
  cartItems?: any[];
  isMobile?: boolean;
}

const HOVER_DELAY = 180; // ms

export default function CartDropdown({ cartItems = [], isMobile = false }: CartDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update items whenever cartItems changes
  useEffect(() => {
    if (cartItems && Array.isArray(cartItems)) {
      setItems(cartItems);
      console.log("[CartDropdown] Cart items updated:", cartItems);
      if (cartItems.length > 0) {
        console.log("[CartDropdown] First item:", cartItems[0]);
        console.log("[CartDropdown] bookId populated?", cartItems[0]?.bookId?.name);
      }
    } else {
      console.log("[CartDropdown] cartItems is not valid array:", cartItems);
    }
  }, [cartItems]);

  const openDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const closeDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      openDropdown();
    }, HOVER_DELAY);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    closeDropdown();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);

  if (isMobile) {
    return (
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {/* Trigger */}
        <Link
          href="/cart"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm"
        >
          <ShoppingCart size={20} />
          <span>Giỏ hàng</span>
        </Link>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold">Giỏ hàng ({items.length})</p>
            </div>

            {items.length > 0 ? (
              <>
                <div className="max-h-64 overflow-y-auto py-2">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="px-4 py-2 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex gap-3">
                        {item.bookId?.mainImage && (
                          <img
                            src={item.bookId.mainImage}
                            alt={item.bookId.name}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.bookId?.name || "Sản phẩm"}
                          </p>
                          <p className="text-xs text-gray-500">
                            x{item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-blue-600">
                            {(item.price * item.quantity).toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between mb-3">
                    <span className="font-semibold">Tổng cộng:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {totalPrice.toLocaleString()}đ
                    </span>
                  </div>
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Xem giỏ hàng
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <ShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Giỏ hàng trống</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {/* Trigger */}
      <Link
        href="/cart"
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm uppercase tracking-wide"
      >
        <ShoppingCart size={18} />
        <span>Giỏ hàng</span>
      </Link>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold">Giỏ hàng ({items.length})</p>
          </div>

          {items.length > 0 ? (
            <>
              <div className="max-h-72 overflow-y-auto py-2">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex gap-3">
                      {item.bookId?.mainImage && (
                        <img
                          src={item.bookId.mainImage}
                          alt={item.bookId.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.bookId?.name || "Sản phẩm"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Số lượng: x{item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                          {(item.price * item.quantity).toLocaleString()}đ
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
                  <span className="font-semibold">Tổng cộng:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {totalPrice.toLocaleString()}đ
                  </span>
                </div>
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Xem giỏ hàng
                </Link>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <ShoppingCart size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Giỏ hàng trống</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
