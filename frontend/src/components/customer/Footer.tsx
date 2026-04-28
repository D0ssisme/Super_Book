import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Heart,
  BookOpen,
} from "lucide-react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="footer-div bg-gradient-to-b from-gray-50 to-red-50 text-gray-800 border-t border-red-100">
      {/* Footer content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 p-10">
        
        {/* Column 1: Brand details */}
        <div className="flex flex-col">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-red-200">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h3 className="footer-title text-red-700 text-2xl font-extrabold tracking-tight">
              SUPERBOOK
            </h3>
          </div>
          <p className="text-gray-600 leading-relaxed mb-6 text-sm">
            Tiên phong trong việc xây dựng hệ sinh thái tri thức số. SuperBook cam kết mang đến những trải nghiệm đọc hiện đại, kết nối độc giả với kho tàng văn hóa nhân loại một cách thông minh và tối ưu nhất.
          </p>

          <div className="space-y-3 mt-auto">
            <div className="flex items-start group">
              <MapPin size={18} className="mr-3 text-red-600 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" />
              <p className="text-gray-700 text-sm">23 Nguyễn Trãi , Quận 5, TP. Hồ Chí Minh</p>
            </div>
            <div className="flex items-center group">
              <Phone size={18} className="mr-3 text-red-600 flex-shrink-0 transition-transform group-hover:scale-110" />
              <p className="text-gray-700 text-sm">0909 123 456</p>
            </div>
            <div className="flex items-center group">
              <Mail size={18} className="mr-3 text-red-600 flex-shrink-0 transition-transform group-hover:scale-110" />
              <p className="text-gray-700 text-sm">contact@superbook.vn</p>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex space-x-4 mt-6">
            {[
              { icon: <Facebook size={18} />, color: "bg-blue-600" },
              { icon: <Twitter size={18} />, color: "bg-sky-500" },
              { icon: <Instagram size={18} />, color: "bg-pink-600" }
            ].map((social, i) => (
              <a key={i} href="#" className={`w-9 h-9 ${social.color} rounded-full flex items-center justify-center text-white hover:opacity-80 transition-all shadow-sm`}>
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-gray-900 text-lg font-bold mb-6 tracking-wide">HỖ TRỢ KHÁCH HÀNG</h3>
          <div className="space-y-3">
            {[
              "Hệ thống cửa hàng",
              "Chính sách bảo mật",
              "Điều khoản sử dụng",
              "Phương thức thanh toán",
              "Chính sách đổi trả & hoàn tiền",
              "Quy trình vận chuyển",
              "Trung tâm trợ giúp (FAQs)",
            ].map((item, index) => (
              <p
                key={index}
                className="text-gray-600 hover:text-red-600 text-sm cursor-pointer transition-all duration-200 hover:translate-x-1 flex items-center"
              >
                <span className="w-1.5 h-1.5 bg-red-300 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity" />
                {item}
              </p>
            ))}
          </div>
        </div>

        {/* Column 3: Fanpage placeholder */}
        <div>
          <h3 className="text-gray-900 text-lg font-bold mb-6 tracking-wide">CỘNG ĐỒNG</h3>
          <a
            className="relative cursor-pointer group block mb-4"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="overflow-hidden rounded-xl shadow-lg border border-red-100 group-hover:border-red-200 transition-all">
              <Image
                width={400}
                height={150}
                className="h-[150px] w-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="/images/fanpage_book.png"
                alt="Fanpage SuperBook"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center space-x-3 text-white">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white">
                   <Image width={40} height={40} src="/images/logo.webp" alt="Logo" />
                </div>
                <div>
                  <p className="font-bold text-sm">SuperBook Store</p>
                  <p className="text-[10px] flex items-center opacity-90">
                    <Heart size={10} className="mr-1 fill-red-500 text-red-500" />
                    25.000+ người theo dõi
                  </p>
                </div>
              </div>
            </div>
          </a>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-red-100 text-center shadow-sm">
            <p className="text-xs text-gray-500 italic font-medium">
              "Kiến tạo tương lai qua từng trang sách"
            </p>
          </div>
        </div>

        {/* Column 4: Newsletter */}
        <div>
          <h3 className="text-gray-900 text-lg font-bold mb-6 tracking-wide">BẢN TIN TRI THỨC</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Đăng ký để nhận thông báo về các đầu sách mới nhất và ưu đãi độc quyền dành riêng cho thành viên SuperBook.
          </p>
          <div className="flex flex-col space-y-3">
            <input
              type="email"
              placeholder="Email của bạn..."
              className="px-4 py-3 border border-red-100 rounded-xl outline-none bg-white text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all text-sm"
            />
            <button className="bg-red-600 hover:bg-red-700 transition-all text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transform">
              ĐĂNG KÝ NGAY
            </button>
          </div>
          <Image
            width={150}
            height={60}
            className="w-[140px] h-auto mt-8 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
            src="/images/dathongbao.png"
            alt="Bộ Công Thương"
          />
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="border-t border-red-100 bg-white/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center px-10 py-6">
          <p className="text-gray-500 text-xs tracking-wider mb-3 sm:mb-0">
            © {new Date().getFullYear()} <span className="font-bold text-red-600">SUPERBOOK SYSTEM</span>. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
            <span>Next.js Architecture</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center">
              Made with <Heart size={12} className="mx-1.5 fill-red-500 text-red-500" /> in Vietnam
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;