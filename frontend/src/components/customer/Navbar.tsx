"use client";

import Image from 'next/image';
import { Star, User2, ShoppingCart } from 'lucide-react';
import { useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import CartIcon from './CartIcon';
import SearchInput from './SearchInput';
import Link from 'next/link';
import { AuthDialog } from '@/components/auth-dialog';
import { useUser } from '@/services/authservices';
import { removeJWTfromCookie } from '@/lib/cookies';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import UserDropdown from './UserDropdown';
import CartPreviewDropdown from './CartPreviewDropdown';
import { useCartStore } from '@/stores/useCartStore';

export default function UserNavbar() {
  const { user, mutate } = useUser();
  const router = useRouter();
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleLogout = async () => {
    router.push("/")
    await removeJWTfromCookie();
    await mutate(null, false);
    toast.success("Đăng xuất thành công");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 shadow-sm bg-white">

      {/* --- MOBILE LAYOUT (Hiển thị dưới 1024px) --- */}
      <div className="lg:hidden flex flex-col w-full bg-white pb-3">
        {/* Dòng 1: Logo + Actions */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Trái: Menu + Logo */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="size-9" />
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/images/logo.webp"
                alt="Logo"
                width={100}
                height={100}
                className="w-24 h-auto"
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
          </div>

          {/* Phải: Cart + User */}
          <div className="flex items-center gap-4">
            {/* Cart icon + text together */}
            <div className="flex items-center gap-1.5">
              {/* Cart icon with badge */}
              <Link href="/cart" className="relative">
                <div className="relative">
                  <ShoppingCart size={20} className="text-gray-700 hover:text-blue-600 transition-colors" />
                  {cart?.items && cart.items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.items.length}
                    </span>
                  )}
                </div>
              </Link>

              {/* Cart text with dropdown */}
              <CartPreviewDropdown 
                cartItems={cart?.items || []} 
                totalPrice={cart?.totalPrice || 0}
              />
            </div>

            {user ? (
              <UserDropdown user={user.data} onLogout={handleLogout} isMobile={true} />
            ) : (
              <AuthDialog>
                <User2 size={24} className="cursor-pointer text-gray-700" />
              </AuthDialog>
            )}
          </div>
        </div>

        <div className="px-4 w-full">
          <SearchInput className="h-10 text-sm" />
        </div>
      </div>


      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden lg:flex justify-between items-center py-4 w-full px-6 max-w-[1400px] mx-auto gap-8">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/images/logo.webp"
            alt="Logo"
            width={150}
            height={150}
            className="cursor-pointer w-32 lg:w-36 h-auto"
          />
        </Link>

        <div className="flex-1 max-w-xl">
          <SearchInput />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 border-r border-gray-200 pr-6 h-8">
            <Link href="about" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium text-sm uppercase tracking-wide">
              <Star size={18} />
              <span>Giới thiệu</span>
            </Link>

            {/* Cart icon + text together */}
            <div className="flex items-center gap-1.5">
              {/* Cart icon with badge */}
              <Link href="/cart" className="relative">
                <div className="relative">
                  <ShoppingCart size={20} className="text-gray-700 hover:text-blue-600 transition-colors" />
                  {cart?.items && cart.items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.items.length}
                    </span>
                  )}
                </div>
              </Link>

              {/* Cart text with dropdown */}
              <CartPreviewDropdown 
                cartItems={cart?.items || []} 
                totalPrice={cart?.totalPrice || 0}
              />
            </div>
          </div>

          {user ? (
            <UserDropdown user={user.data} onLogout={handleLogout} isMobile={false} />
          ) : (
            <AuthDialog>
              <Button className="rounded-full px-6 font-semibold shadow-md cursor-pointer">
                Đăng nhập
              </Button>
            </AuthDialog>
          )}
        </div>
      </div>
    </nav>
  );
}