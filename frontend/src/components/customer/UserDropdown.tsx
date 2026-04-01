"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, User2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UserDropdownProps {
  user: any;
  onLogout: () => void;
  isMobile?: boolean;
}

const HOVER_DELAY = 180; // ms

export default function UserDropdown({ user, onLogout, isMobile = false }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const MenuItem = ({ 
    href, 
    icon, 
    label, 
    onClick, 
    isDanger = false 
  }: { 
    href?: string; 
    icon?: React.ReactNode; 
    label: string; 
    onClick?: () => void;
    isDanger?: boolean;
  }) => {
    const baseClass = `w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
      isDanger
        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
    }`;

    if (href) {
      return (
        <Link
          href={href}
          className={baseClass}
          onClick={() => setIsOpen(false)}
        >
          {icon && <span className="text-base">{icon}</span>}
          <span>{label}</span>
        </Link>
      );
    }

    return (
      <button
        onClick={() => {
          onClick?.();
          setIsOpen(false);
        }}
        className={baseClass}
      >
        {icon && <span className="text-base">{icon}</span>}
        <span>{label}</span>
      </button>
    );
  };

  if (isMobile) {
    return (
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {/* Trigger */}
        <div className="size-9 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center cursor-pointer text-blue-600 hover:shadow-md transition-all">
          <User2 size={20} />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            <div className="py-2">
              <MenuItem
                href="/account"
                icon={<User2 size={16} />}
                label="Hồ sơ cá nhân"
              />
              <MenuItem
                href="/account?tab=orders"
                icon="📦"
                label="Đơn mua"
              />
              {user.role === "admin" && (
                <MenuItem href="/admin" icon="⚙️" label="Quản Lý" />
              )}
            </div>

            <div className="border-t border-gray-100 py-2">
              <MenuItem
                icon={<LogOut size={16} />}
                label="Đăng xuất"
                onClick={onLogout}
                isDanger={true}
              />
            </div>
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
      <Button
        variant="outline"
        className="gap-2 rounded-full border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 px-4 h-10 transition-all"
      >
        <User2 size={18} />
        <span className="font-semibold max-w-[120px] truncate">{user.fullName}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="py-2">
            <MenuItem
              href="/account"
              icon={<User2 size={16} />}
              label="Hồ sơ cá nhân"
            />
            <MenuItem
              href="/account?tab=orders"
              icon="📦"
              label="Đơn mua"
            />
            {user.role === "admin" && (
              <MenuItem href="/admin" icon="⚙️" label="Quản Lý" />
            )}
          </div>

          <div className="border-t border-gray-100 py-2">
            <MenuItem
              icon={<LogOut size={16} />}
              label="Đăng xuất"
              onClick={onLogout}
              isDanger={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
