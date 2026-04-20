"use client";

import { formatPrice } from "@/lib/utils";
import { bookServices } from "@/services/bookServices";
import Image from "next/image";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";

interface OrderItemProps {
  bookId: string;
  quantity: number;
  price: number;
}

const OrderItem = ({ bookId, quantity, price }: OrderItemProps) => {
  const { data: book, isLoading } = useSWR(
    bookId ? `/books/${bookId}` : null,
    () => bookServices.getBookById(bookId)
  );

  if (isLoading || !book) {
    return <div className="h-20 bg-gray-100 rounded animate-pulse mb-4"></div>;
  }

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      <div className="relative w-16 h-20 flex-shrink-0 border rounded overflow-hidden">
        <Image
          src={book.imageUrl[0]}
          alt={book.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-medium text-gray-800 line-clamp-1">{book.name}</h4>
          {book.event && book.event.discountPercent > 0 && (
            <Badge className="bg-red-50 text-red-600 border-red-100 text-xs font-semibold">
              -{book.event.discountPercent}%
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-500 mt-1">
          Số lượng: <span className="font-medium text-gray-900">{quantity}</span>
        </div>

        <div className="mt-1">
          {book.event && Number(book.price) > Number(price) ? (
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-400 line-through">{formatPrice(Number(book.price))}</span>
              <span className="text-lg font-semibold text-red-600">{formatPrice(price)}</span>
              <span className="text-xs text-green-600">Tiết kiệm {formatPrice(Math.max(0, (Number(book.price) - Number(price)) * quantity))}</span>
            </div>
          ) : (
            <div className="text-sm font-medium text-red-600">{formatPrice(price)}</div>
          )}

          <div className="text-gray-400 text-xs mt-1">(Tổng: {formatPrice(price * quantity)})</div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;