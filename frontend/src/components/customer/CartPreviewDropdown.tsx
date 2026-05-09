"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { bookServices } from "@/services/bookServices";
import { useCartStore } from "@/stores/useCartStore";
import { toast } from "sonner";

interface CartPreviewDropdownProps {
  cartItems?: any[];
  totalPrice?: number;
}

interface BookData {
  _id: string;
  name: string;
  imageUrl?: string[];
  mainImage?: string;
}

const HOVER_DELAY = 150; // ms

export default function CartPreviewDropdown({ 
  cartItems = [], 
  totalPrice = 0 
}: CartPreviewDropdownProps) {
  const router = useRouter();
  const removeCartItem = useCartStore((state) => state.removeCartItem);
  const [isOpen, setIsOpen] = useState(false);
  const [bookDataMap, setBookDataMap] = useState<Map<string, BookData>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deletedProductsRef = useRef<Set<string>>(new Set());

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

  // Fetch book data when dropdown opens
  useEffect(() => {
    if (!isOpen || cartItems.length === 0) return;

    // Clear any pending fetch
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

    // Fetch book data for items we don't have yet
    const itemsToFetch = cartItems.slice(0, 5).filter(item => !bookDataMap.has(item.bookId));
    
    if (itemsToFetch.length === 0) return;

    const fetchBooks = async () => {
      const newMap = new Map(bookDataMap);
      
      for (const item of itemsToFetch) {
        if (!newMap.has(item.bookId)) {
          try {
            const book = await bookServices.getBookById(item.bookId);
            newMap.set(item.bookId, book);
          } catch (error: any) {
            // Check if product was deleted (404 or 400 error)
            if (error.status === 404 || error.status === 400) {
              // Mark as deleted
              deletedProductsRef.current.add(item.bookId);
              
              // Show notification
              const cartItem = cartItems.find(c => c.bookId === item.bookId);
              const productName = cartItem?.name || 'sản phẩm';
              
              toast.error(`Sản phẩm "${productName}" đã bị xóa khỏi kho`, {
                description: "Sản phẩm sẽ tự động xóa khỏi giỏ hàng của bạn",
              });
              
              // Auto remove from cart
              if (cartItem) {
                try {
                  await removeCartItem(cartItem._id);
                } catch (removeError) {
                  console.error(`Failed to remove cart item ${cartItem._id}:`, removeError);
                }
              }
            } else {
              console.error(`Failed to fetch book ${item.bookId}:`, error);
            }
          }
        }
      }
      
      setBookDataMap(newMap);
    };

    fetchBooks();

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [isOpen, cartItems, bookDataMap, removeCartItem]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  // Get 5 most recent items (reverse order since last added is at end)
  const recentItems = cartItems.slice(-5).reverse();

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {/* Trigger - clickable text to navigate */}
      <span 
        onClick={() => router.push('/cart')}
        className="cursor-pointer text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm"
      >
        Giỏ hàng
      </span>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold">
              {cartItems.length > 0 
                ? `Giỏ hàng (${cartItems.length} sản phẩm)` 
                : 'Giỏ hàng (trống)'}
            </p>
          </div>

          {cartItems.length > 0 ? (
            <>
              {/* Recent items */}
              <div className="max-h-64 overflow-y-auto py-2">
                {recentItems.map((item) => {
                  const bookData = bookDataMap.get(item.bookId);
                  const noPicture = !bookData;
                  
                  return (
                    <div
                      key={item._id}
                      className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex gap-3">
                        {/* Book image */}
                        {bookData?.imageUrl?.[0] || bookData?.mainImage ? (
                          <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                            <Image
                              src={bookData.imageUrl?.[0] || bookData.mainImage || '/placeholder.jpg'}
                              alt={bookData.name}
                              fill
                              className="object-cover w-full h-full"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-16 flex-shrink-0 rounded bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">No img</span>
                          </div>
                        )}

                        {/* Book info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">
                            {bookData?.name || 'Loading...'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            x{item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-blue-600 mt-1">
                            {(item.price * item.quantity).toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng số lượng:</span>
                    <span className="font-semibold">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-blue-600">
                      {totalPrice.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => router.push('/cart')}
                  className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer"
                >
                  Xem giỏ hàng
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">Giỏ hàng trống</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer bg-transparent border-0"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
