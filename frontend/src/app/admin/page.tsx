"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BookOpen,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
} from "recharts";
import {
  getOverviewStats,
  getRevenueStats,
  getTopProducts,
  getTopCategories,
  getPaymentMethodsStats,
  getComparisonStats,
} from "@/api/statisticsApi";

// Helper function để format date từ input type="date"
const formatDateToISO = (dateString: string): string => {
  if (!dateString) return "";
  // Input type="date" trả về YYYY-MM-DD
  return dateString;
};

// Helper function để display date ở định dạng DD/MM/YYYY
const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalOrderValue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    cancelledAmount: 0,
    totalCategories: 0,
    lowStockBooks: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalProfit: 0,
    totalCost: 0,
    // Comparison data
    revenueChange: 0,
    ordersChange: 0,
    profitChange: 0,
    usersChange: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any>({
    methods: [],
    totalOrders: 0,
  });
  const [revenueView, setRevenueView] = useState<"day" | "month" | "year">(
    "month",
  );

  // State cho revenue filters
  const [revenueDateFrom, setRevenueDateFrom] = useState<string>("");
  const [revenueDateTo, setRevenueDateTo] = useState<string>("");
  const [revenueMonth, setRevenueMonth] = useState<string>(() => {
    const now = new Date();
    return (now.getMonth() + 1).toString().padStart(2, "0");
  });
  const [revenueYear, setRevenueYear] = useState<string>(() =>
    new Date().getFullYear().toString(),
  );
  const [revenueFilterYear, setRevenueFilterYear] = useState<string>(() =>
    new Date().getFullYear().toString(),
  );

  // State cho lọc khoảng thời gian chính (dashboard)
  const [dashboardDateFrom, setDashboardDateFrom] = useState<string>("");
  const [dashboardDateTo, setDashboardDateTo] = useState<string>("");

  // Fetch overview stats
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const [overviewResponse, comparisonResponse] = await Promise.all([
          (getOverviewStats as any)(
            dashboardDateFrom || undefined,
            dashboardDateTo || undefined,
          ),
          getComparisonStats(),
        ]);

        if (overviewResponse.success) {
          const statsWithComparison = {
            ...overviewResponse.data,
            ...(comparisonResponse.success
              ? comparisonResponse.data
              : {
                  revenueChange: 0,
                  ordersChange: 0,
                  profitChange: 0,
                  usersChange: 0,
                }),
          };
          setStats(statsWithComparison);
        } else {
          setError("Không thể tải dữ liệu thống kê");
        }
      } catch (error) {
        console.error("Error fetching overview stats:", error);
        setError("Lỗi khi tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [dashboardDateFrom, dashboardDateTo]);

  // Fetch revenue stats
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setRevenueLoading(true);
        let from: string | null = null;
        let to: string | null = null;

        if (revenueView === "day" && revenueDateFrom && revenueDateTo) {
          from = revenueDateFrom;
          to = revenueDateTo;
        } else if (revenueView === "month" && revenueYear && revenueMonth) {
          from = `${revenueYear}-${revenueMonth.padStart(2, "0")}-01`;
          const lastDay = new Date(
            parseInt(revenueYear),
            parseInt(revenueMonth),
            0,
          ).getDate();
          to = `${revenueYear}-${revenueMonth.padStart(2, "0")}-${lastDay}`;
        } else if (revenueView === "year" && revenueFilterYear) {
          from = `${revenueFilterYear}-01-01`;
          to = `${revenueFilterYear}-12-31`;
        }

        const response = await (getRevenueStats as any)(revenueView, from, to);
        if (response.success) {
          setRevenueData(response.data);
        }
      } catch (error) {
        console.error("Error fetching revenue stats:", error);
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenue();
  }, [
    revenueView,
    revenueDateFrom,
    revenueDateTo,
    revenueMonth,
    revenueYear,
    revenueFilterYear,
  ]);

  // Fetch top products, categories, and payment methods (respect dashboard date range)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setTopProductsLoading(true);
        const [productsRes, categoriesRes, paymentRes] = await Promise.all([
          (getTopProducts as any)(5, dashboardDateFrom || null, dashboardDateTo || null),
          (getTopCategories as any)(5, dashboardDateFrom || null, dashboardDateTo || null),
          (getPaymentMethodsStats as any)(dashboardDateFrom || null, dashboardDateTo || null),
        ]);

        if (productsRes.success) {
          setTopProducts(productsRes.data);
        }
        if (categoriesRes.success) {
          setTopCategories(categoriesRes.data);
        }
        if (paymentRes.success) {
          setPaymentMethods(paymentRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTopProductsLoading(false);
      }
    };
    fetchData();
  }, [dashboardDateFrom, dashboardDateTo]);

  // Lấy danh sách năm (giả định từ 2020 đến năm hiện tại)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  // Format VND
  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  // Render trend indicator
  const TrendIndicator = ({ value }: { value: number }) => {
    if (value === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Minus className="w-3 h-3" />
          0%
        </span>
      );
    }

    const isPositive = value > 0;
    const color = isPositive ? "text-green-600" : "text-red-600";
    const Icon = isPositive ? ArrowUp : ArrowDown;

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}
      >
        <Icon className="w-3 h-3" />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const revenueChartData = revenueData.map((item) => ({
    period: item.period,
    revenue: item.revenue,
    cost: item.cost,
    profit: item.profit,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "processing":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "delivered":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      case "cancelled":
        return "bg-gray-100 text-gray-600 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  // Use data returned from backend (paymentMethods)
  const displayedPaymentMethods = paymentMethods.methods || [];
  const displayedTotalOrders = paymentMethods.totalOrders || 0;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-l-4 border-emerald-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">
              Dashboard - Tổng quan hệ thống
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Theo dõi và quản lý hoạt động cửa hàng
            </p>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Chọn khoảng thời gian:
          </span>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 font-medium">
                Từ ngày:
              </label>
              <input
                type="date"
                value={dashboardDateFrom}
                onChange={(e) => setDashboardDateFrom(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 font-medium">
                Đến ngày:
              </label>
              <input
                type="date"
                value={dashboardDateTo}
                onChange={(e) => setDashboardDateTo(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {(dashboardDateFrom || dashboardDateTo) && (
              <button
                onClick={() => {
                  setDashboardDateFrom("");
                  setDashboardDateTo("");
                }}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all whitespace-nowrap"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-red-700 hover:text-red-900 font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Stats Grid - Row 1: 5 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Doanh thu */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-2">
                  Doanh thu
                </p>
                <p className="text-2xl font-bold text-white mb-1">
                  {loading ? "..." : formatVND(stats.totalOrderValue)}
                </p>
                <div className="text-xs text-emerald-100 mt-2 space-y-1">
                  <div>Đã thanh toán: <strong>{loading ? '...' : formatVND(stats.paidAmount)}</strong></div>
                  <div>Đang đợi thanh toán: <strong>{loading ? '...' : formatVND(stats.pendingAmount)}</strong></div>
                  <div>Đã hủy: <strong>{loading ? '...' : formatVND(stats.cancelledAmount)}</strong></div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendIndicator value={stats.revenueChange} />
                  <span className="text-xs text-emerald-100">
                    vs tháng trước
                  </span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Đơn hàng */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">
                  Đơn hàng
                </p>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-3xl font-bold text-gray-800">
                    {loading ? "..." : stats.totalOrders}
                  </p>
                  <TrendIndicator value={stats.ordersChange} />
                </div>
                <p className="text-xs text-amber-600">
                  {stats.pendingOrders} chờ xử lý
                </p>
              </div>
              <div className="bg-blue-600 p-4 rounded-lg">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

        </div>

        {/* Profit chart removed as requested */}

        {/* Three Column Layout: Top Products + Order Stats + Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top sách bán chạy */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Top 5 sách bán chạy
              </h3>
            </div>
            <div className="p-6">
              {topProductsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-10 h-14 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Chưa có dữ liệu</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Sản phẩm bán chạy sẽ hiển thị tại đây
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, idx) => (
                    <div
                      key={product.bookId}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 group border border-transparent hover:border-gray-200"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          #{idx + 1}
                        </span>
                      </div>
                      <Image
                        src={
                          product.bookImage ||
                          "https://placehold.co/400x600/e2e8f0/64748b?text=No+Image"
                        }
                        alt={product.bookName}
                        width={40}
                        height={56}
                        className="w-10 h-14 object-cover rounded-lg shadow-sm border border-gray-200"
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium truncate text-sm">
                          {product.bookName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Doanh thu: {formatVND(product.totalRevenue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-600 font-bold text-lg">
                          {product.totalQuantity}
                        </p>
                        <p className="text-xs text-gray-500">đã bán</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Statistics */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Thống kê đơn hàng
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-sm font-medium text-gray-700">
                    Hoàn thành
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {stats.completedOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-sm font-medium text-gray-700">
                    Chờ xử lý
                  </span>
                  <span className="text-lg font-bold text-amber-600">
                    {stats.pendingOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Đã hủy
                  </span>
                  <span className="text-lg font-bold text-gray-600">
                    {stats.cancelledOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-gray-700">
                    Tổng đơn
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {stats.totalOrders}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Top 5 thể loại bán chạy
              </h3>
            </div>
            <div className="p-6">
              {topCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Chưa có dữ liệu
                </div>
              ) : (
                <div className="space-y-3">
                  {topCategories.map((category, idx) => {
                    const colors = [
                      "bg-purple-600",
                      "bg-blue-600",
                      "bg-emerald-600",
                      "bg-amber-600",
                      "bg-pink-600",
                    ];
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-400">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-800">
                                {category.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatVND(category.revenue)}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-700">
                            {category.percentage?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${colors[idx % colors.length]} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${category.percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4 text-center">
                Dựa trên doanh thu bán hàng
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods - Full Width */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Phương thức thanh toán
            </h3>
          </div>
          <div className="p-6">
            {displayedPaymentMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="space-y-4">
                {displayedPaymentMethods.map((payment: any, idx: number) => {
                  const methodConfig: Record<
                    string,
                    { label: string; icon: string; color: string }
                  > = {
                    COD: {
                      label: "COD (Tiền mặt)",
                      icon: "💵",
                      color: "bg-emerald-600",
                    },
                    cash: {
                      label: "COD (Tiền mặt)",
                      icon: "💵",
                      color: "bg-emerald-600",
                    },
                    MOMO: {
                      label: "MoMo",
                      icon: "👜",
                      color: "bg-pink-600",
                    },
                    momo: {
                      label: "MoMo",
                      icon: "👜",
                      color: "bg-pink-600",
                    },
                  };
                  const config = methodConfig[payment.method] || {
                    label: payment.method,
                    icon: "💰",
                    color: "bg-gray-600",
                  };
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800">
                              {config.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.count} đơn hàng -{" "}
                              {formatVND(payment.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-gray-700">
                          {payment.percentage?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`${config.color} h-2.5 rounded-full transition-all duration-500`}
                          style={{ width: `${payment.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Tổng giao dịch
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {displayedTotalOrders || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
