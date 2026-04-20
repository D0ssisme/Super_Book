"use client";
import { bookServices } from "@/services/bookServices";
import { Book } from "@/types/book.type";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import ProductCard from "../collections/components/ProductCard";

export default function EventShowcase() {
  const [discountBooks, setDiscountBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchDiscountBooks();
  }, []);

  const fetchDiscountBooks = async () => {
    try {
      setLoading(true);
      const response = await bookServices.getBooks(1, 30, "", [], "", undefined, undefined, "newest");

      const books = Array.isArray(response?.data) ? response.data : [];
      const onlyDiscountBooks = books
        .filter((book) => book.event?.discountPercent && book.event.discountPercent > 0)
        .sort((a, b) => (b.event?.discountPercent || 0) - (a.event?.discountPercent || 0));

      setDiscountBooks(onlyDiscountBooks);
    } catch (error) {
      console.error("Error fetching discount books:", error);
      setDiscountBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollByAmount = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = Math.max(260, Math.floor(scrollRef.current.clientWidth * 0.75));
    scrollRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="w-full mt-12 mb-20">
        <div className="text-center">
          <p className="text-gray-500">Đang tải sách giảm giá...</p>
        </div>
      </div>
    );
  }

  if (discountBooks.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12 mb-20">
      {/* Title */}
      <div className="text-center mb-5">
        <h2 className="font-semibold text-3xl text-gray-900 mb-4 flex items-center justify-center gap-2">
          <Flame className="w-8 h-8 text-red-500 animate-bounce" />
          Sách Đang Giảm Giá
          <Flame className="w-8 h-8 text-red-500 animate-bounce" />
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-red-400 to-pink-600 mx-auto rounded-full"></div>
        <p className="text-gray-600 mt-3 text-lg">
          Lướt ngang để xem nhanh và mua ngay các đầu sách đang có ưu đãi
        </p>
      </div>

      {/* Horizontal Discount Books */}
      <div className="relative">
        <button
          type="button"
          aria-label="Xem sách trước"
          onClick={() => scrollByAmount("left")}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 border border-gray-200 shadow items-center justify-center hover:bg-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory"
        >
          {discountBooks.map((book) => (
            <div
              key={book._id}
              className="min-w-[180px] max-w-[180px] sm:min-w-[210px] sm:max-w-[210px] snap-start"
            >
              <ProductCard
                _id={book._id}
                name={book.name}
                price={book.price}
                imgSrc={book.imageUrl?.[0] || "https://placehold.co/400x600/e2e8f0/64748b?text=No+Image"}
                stock={book.quantity}
                event={book.event}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Xem sách tiếp theo"
          onClick={() => scrollByAmount("right")}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 border border-gray-200 shadow items-center justify-center hover:bg-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
