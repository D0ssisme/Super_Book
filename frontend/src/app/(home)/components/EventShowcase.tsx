"use client";
import { getActiveEventsApi } from "@/services/EventApi";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import Link from "next/link";

interface Event {
  _id: string;
  name: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}

export default function EventShowcase() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  const fetchActiveEvents = async () => {
    try {
      setLoading(true);
      const data = await getActiveEventsApi();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full mt-12 mb-20">
        <div className="text-center">
          <p className="text-gray-500">Đang tải sự kiện...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12 mb-20">
      {/* Title */}
      <div className="text-center mb-5">
        <h2 className="font-semibold text-3xl text-gray-900 mb-4 flex items-center justify-center gap-2">
          <Flame className="w-8 h-8 text-red-500 animate-bounce" />
          Sự kiện Giảm giá
          <Flame className="w-8 h-8 text-red-500 animate-bounce" />
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-red-400 to-pink-600 mx-auto rounded-full"></div>
        <p className="text-gray-600 mt-3 text-lg">
          Các sử kiện giảm giá đang diễn ra
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Link key={event._id} href="/collections">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              {/* Header with discount badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-red-600 transition">
                    {event.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-bold ml-2 flex-shrink-0">
                  -{event.discountPercent}%
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {event.description}
                </p>
              )}

              {/* CTA Button */}
              <div className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold group-hover:from-red-600 group-hover:to-red-700 transition shadow-md">
                Xem chi tiết →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
