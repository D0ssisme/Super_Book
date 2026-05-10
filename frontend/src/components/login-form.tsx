"use client";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema } from '@/validation/authschemas';
import { setJWTtoCookie } from '@/lib/cookies';
import { login, useUser } from '@/services/authservices';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ButtonLoginGoogle } from '@/components/button/button-google-login';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/useCartStore';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { notifyAccountLocked } from '@/lib/account-lock';

const REMEMBER_LOGIN_KEY = 'remember_login_username';

type LoginRequest = {
  username: string;
  password: string;
};

export function LoginForm({
  className,
  setMode,
  onSuccess,
  ...props
}: React.ComponentProps<'form'> & {
  setMode?: (mode: 'login' | 'register' | 'reset-password') => void
  onSuccess?: () => void
}) {
  const { mutate } = useUser();
  const { onLoginSuccess } = useCartStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(REMEMBER_LOGIN_KEY);
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<LoginRequest>({
    defaultValues: { username: "", password: "" },
    resolver: zodResolver(LoginRequestSchema),
    mode: 'onChange'
  });

  // Load saved username on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedUsername = localStorage.getItem(REMEMBER_LOGIN_KEY);
    if (savedUsername) {
      setValue('username', savedUsername);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginRequest) => {
    const res = await login(data);
    if (res.code == "USER_NOT_FOUND") {
      setError("username", { message: res.message });
      return;
    }
    if (res.code == "INVALID_PASSWORD") {
      setError("password", { message: res.message });
      return;
    }
    if (res.code == "ACCOUNT_LOCKED") {
      notifyAccountLocked(res.message || 'Tài khoản của bạn đã bị khóa');
      return;
    }
    if ("token" in res.data) {
      // Save username if "remember password" is checked
      if (rememberPassword) {
        localStorage.setItem(REMEMBER_LOGIN_KEY, data.username);
      }

      // Step 1: Save JWT token
      await setJWTtoCookie(res.data.token);

      // Step 2: Update user state
      await mutate();

      // Step 3: Auto-merge guest cart with user cart
      // (if guest has items, merge them; otherwise fetch user cart)
      try {
        await onLoginSuccess();
      } catch (error) {
        console.error("Cart merge error during login:", error);
        // Don't block login if cart merge fails
      }

      toast.success("Đăng nhập thành công");
      onSuccess?.();
      return;
    }
  };

  const handleClearCredentials = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REMEMBER_LOGIN_KEY);
    setValue('username', '');
    setRememberPassword(false);
    toast.success("Đã xóa thông tin lưu trữ");
  };

  return (
    <div className={cn("grid gap-6", className)}>
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            <ButtonLoginGoogle onSuccess={onSuccess} />
          </GoogleOAuthProvider>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Hoặc
            </span>
          </div>
        </>
      )}

      <form
        className="grid gap-4"
        {...props}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid gap-2">
          <Label htmlFor="emailOrUsername" className={cn(errors.username && "text-red-500")}>
            Email hoặc tên đăng nhập
          </Label>
          <Input
            id="emailOrUsername"
            type="text"
            {...register("username")}
            className={cn(errors.username && "border-red-500 focus-visible:ring-red-500")}
            placeholder="name@example.com"
          />
          {errors.username && (
            <p className="text-red-500 text-xs font-medium animate-in fade-in-50 slide-in-from-top-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={cn(errors.password && "text-red-500")}>
              Mật khẩu
            </Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={cn(
                "pr-10",
                errors.password && "border-red-500 focus-visible:ring-red-500"
              )}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs font-medium animate-in fade-in-50 slide-in-from-top-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberPassword"
              checked={rememberPassword}
              onChange={(e) => setRememberPassword(e.target.checked)}
              className="h-4 w-4 rounded border border-input cursor-pointer"
            />
            <Label
              htmlFor="rememberPassword"
              className="text-sm font-normal cursor-pointer"
            >
              Nhớ mật khẩu
            </Label>
          </div>
          {rememberPassword && (
            <button
              type="button"
              onClick={handleClearCredentials}
              className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Xóa
            </button>
          )}
        </div>

        <div className="flex items-center justify-end">
          <a
            onClick={() => setMode?.('reset-password')}
            className="text-sm font-medium underline underline-offset-4 text-sky-600 cursor-pointer hover:text-sky-700"
          >
            Quên mật khẩu?
          </a>
        </div>

        <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <a className="underline underline-offset-4 cursor-pointer text-primary hover:text-primary/80" onClick={() => setMode?.("register")}>
            Đăng ký ngay
          </a>
        </div>
      </form>
    </div>
  );
}