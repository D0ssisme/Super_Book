"use client";
import { cn } from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterRequestSchema } from "@/validation/authschemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registerUser, useUser } from "@/services/authservices";
import { setJWTtoCookie } from "@/lib/cookies";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDistricts, getProvinces, Province } from "@/services/addressservices";

type RegisterRequest = {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  detail: string;
  province: string;
  district: string;
  password: string;
  confirmPassword: string;
};
type BackendError = {
  field: string;
  message: string;
};

export function RegisterForm({
  className,
  setMode,
  onSuccess,
  ...props
}: React.ComponentProps<"form"> & {
  setMode?: (mode: "login" | "register") => void;
  onSuccess?: () => void;
}) {
  const { mutate } = useUser();
  const { provinces, isLoading: isLoadingProvinces } = getProvinces();
  const [districts, setDistricts] = useState<Province[]>([]);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
    setError,
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    mode: "onSubmit",
    defaultValues: {
      fullName: "",
      username: "",
      phone: "",
      email: "",
      detail: "",
      province: "",
      district: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedProvince = watch("province");

  const filteredProvinces = provinces?.filter((prov) =>
    (prov.full_name?.toLowerCase() + " " + prov.name?.toLowerCase()).includes(
      provinceSearch.toLowerCase()
    )
  ) || [];

  const filteredDistricts = districts.filter((dist) =>
    (dist.full_name?.toLowerCase() + " " + dist.name?.toLowerCase()).includes(
      districtSearch.toLowerCase()
    )
  );

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setValue("district", "", { shouldValidate: true });
      return;
    }

    const province = provinces?.find((item) => String(item.id) === String(selectedProvince));
    if (!province?.id) return;

    setValue("district", "", { shouldValidate: true });
    getDistricts(String(province.id))
      .then((res) => setDistricts(res || []))
      .catch(() => setDistricts([]));
  }, [provinces, selectedProvince, setValue]);

  const onSubmit = async (data: RegisterRequest) => {
    const province = provinces?.find((item) => String(item.id) === String(data.province));
    const district = districts.find((item) => String(item.id) === String(data.district));

    const payload = {
      ...data,
      province: province?.full_name || province?.name || data.province,
      district: district?.full_name || district?.name || data.district,
    };

    const res = await registerUser(payload);
    if (res.errors) {
      res.errors.forEach((err: BackendError) => {
        setError(err.field as keyof RegisterRequest, { message: err.message });
      });
      if (res.errors.length === 0 && res.message) {
        toast.error(res.message);
      }
      return;
    }
    if (res?.data && "token" in res.data) {
      await setJWTtoCookie(res.data.token);
      await mutate();
      toast.success("Đăng kí thành công");
      onSuccess?.();
      return;
    }
    toast.error("Đăng kí thất bại. Vui lòng thử lại.");
  };

  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <p className="text-red-500 text-xs font-medium animate-in fade-in-50 slide-in-from-top-1">
        {message}
      </p>
    );
  };

  return (
    <form
      className={cn("grid gap-4", className)}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-2">
        <Label htmlFor="fullname" className={cn(errors.fullName && "text-red-500")}>
          Họ và tên *
        </Label>
        <Input
          id="fullname"
          type="text"
          {...register("fullName")}
          placeholder="Nhập họ tên đầy đủ"
          className={cn(
            errors.fullName && "border-red-500 focus-visible:ring-red-500",
          )}
        />
        <ErrorMessage message={errors.fullName?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="username" className={cn(errors.username && "text-red-500")}>
          Tên đăng nhập *
        </Label>
        <Input
          id="username"
          type="text"
          {...register("username")}
          placeholder="Tên đăng nhập duy nhất"
          className={cn(
            errors.username && "border-red-500 focus-visible:ring-red-500",
          )}
        />
        <ErrorMessage message={errors.username?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone" className={cn(errors.phone && "text-red-500")}>
          Số điện thoại * <span className="text-xs text-muted-foreground">(10 chữ số, bắt đầu 0)</span>
        </Label>
        <Input
          id="phone"
          type="text"
          {...register("phone")}
          placeholder="0912345678"
          className={cn(
            errors.phone && "border-red-500 focus-visible:ring-red-500",
          )}
        />
        <ErrorMessage message={errors.phone?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email" className={cn(errors.email && "text-red-500")}>
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="your@email.com"
          className={cn(
            errors.email && "border-red-500 focus-visible:ring-red-500",
          )}
        />
        <ErrorMessage message={errors.email?.message} />
      </div>

      <div className="grid gap-2 md:grid-cols-2 gap-y-4 gap-x-3">
        <div className="grid gap-1.5">
          <Label htmlFor="detail" className={cn(errors.detail && "text-red-500")}>
            Địa chỉ chi tiết *
          </Label>
          <Input
            id="detail"
            type="text"
            {...register("detail")}
            placeholder="Số nhà, tên đường, phường/xã..."
            className={cn(
              errors.detail && "border-red-500 focus-visible:ring-red-500",
            )}
          />
          <ErrorMessage message={errors.detail?.message} />
        </div>

        <div className="grid gap-1.5">
          <Label className={cn(errors.province && "text-red-500")}>
            Tỉnh / Thành phố *
          </Label>
          <Controller
            control={control}
            name="province"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(val) => {
                field.onChange(val);
                setProvinceSearch("");
              }}>
                <SelectTrigger className={cn(
                  "w-full",
                  errors.province && "border-red-500"
                )}>
                  <SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh"} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 pb-0">
                    <Input
                      placeholder="Tìm tỉnh/thành phố... "
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProvinces.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.full_name || prov.name}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            )}
          />
          {errors.province && <ErrorMessage message={errors.province.message} />}
        </div>

        <div className="grid gap-1.5">
          <Label className={cn(errors.district && "text-red-500")}>
            Quận / Huyện *
          </Label>
          <Controller
            control={control}
            name="district"
            render={({ field }) => (
              <Select 
                value={field.value} 
                onValueChange={(val) => {
                  field.onChange(val);
                  setDistrictSearch("");
                }}
                disabled={!selectedProvince}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  !selectedProvince && "opacity-50 cursor-not-allowed",
                  errors.district && "border-red-500"
                )}>
                  <SelectValue 
                    placeholder={!selectedProvince ? "Chọn tỉnh trước" : districts.length === 0 ? "Đang tải..." : "Chọn quận"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 pb-0">
                    <Input
                      placeholder="Tìm quận..."
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      className="h-8 text-sm"
                      disabled={!selectedProvince}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredDistricts.map((dist) => (
                      <SelectItem key={dist.id} value={dist.id}>
                        {dist.full_name || dist.name}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            )}
          />
          {errors.district && selectedProvince && <ErrorMessage message={errors.district.message} />}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password" className={cn(errors.password && "text-red-500")}>
          Mật khẩu * <span className="text-xs text-muted-foreground">(tối thiểu 6 ký tự)</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="••••••••"
            className={cn(
              "pr-10",
              errors.password && "border-red-500 focus-visible:ring-red-500",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <ErrorMessage message={errors.password?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword" className={cn(errors.confirmPassword && "text-red-500")}>
          Nhập lại mật khẩu *
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder="••••••••"
            className={cn(
              "pr-10",
              errors.confirmPassword &&
                "border-red-500 focus-visible:ring-red-500",
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <ErrorMessage message={errors.confirmPassword?.message} />
      </div>

      <Button
        type="submit"
        className="w-full mt-2 cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
      </Button>

      <div className="text-center text-sm text-muted-foreground mt-1">
        Đã có tài khoản?{" "}
        <a
          className="underline underline-offset-4 cursor-pointer text-primary hover:text-primary/80"
          onClick={() => setMode?.("login")}
        >
          Đăng nhập
        </a>
      </div>
    </form>
  );
}
