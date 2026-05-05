"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Building2,
  Home,
  Loader2,
  MapPin,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Address, addressSchema } from "@/types/address.type";
import { cn } from "@/lib/utils";
import {
  createAddress,
  updateAddress,
  getDistricts,
  getProvinces,
  Province,
} from "@/services/addressservices";
import { useUser } from "@/services/authservices";
import { toast } from "sonner";

interface CreateAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Address | null;
  onSuccess?: (addr: Address) => void;
}

const ADDRESS_TYPES = [
  { id: "Nhà riêng", label: "Nhà riêng", icon: Home },
  { id: "Phòng trọ", label: "Phòng trọ", icon: Building2 },
  { id: "Văn phòng", label: "Văn phòng", icon: Briefcase },
  { id: "Khác", label: "Khác", icon: MapPin },
];

export const CreateAddressModal = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: CreateAddressModalProps) => {
  const [districts, setDistricts] = useState<Province[]>([]);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<Address>({
    defaultValues: {
      _id: initialData?._id,
      name: initialData?.name || user?.data?.fullName || "",
      phone: initialData?.phone || user?.data?.phone || "",
      province: initialData?.province || "",
      district: initialData?.district || "",
      detail: initialData?.detail || "",
      addressType: initialData?.addressType || "Nhà riêng",
      isDefault: initialData?.isDefault || false,
    },
    resolver: zodResolver(addressSchema),
    mode: "onSubmit",
  });

  const { provinces, isLoading: isLoadingProvinces } = getProvinces();
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
      setValue("district", "");
      return;
    }

    const province = provinces?.find((item) => String(item.id) === String(selectedProvince));
    if (!province?.id) return;

    getDistricts(String(province.id))
      .then((res) => setDistricts(res || []))
      .catch(() => setDistricts([]));
  }, [provinces, selectedProvince, setValue]);

  const onSubmit = async (data: Address) => {
    const province = provinces?.find((item) => String(item.id) === String(data.province));
    const district = districts.find((item) => String(item.id) === String(data.district));

    const payload: Address = {
      ...data,
      province: province?.full_name || province?.name || data.province,
      district: district?.full_name || district?.name || data.district,
    };

    try {
      let res;
      if (initialData?._id) {
        res = await updateAddress(payload);
        if (res) {
          toast.success("Cập nhật địa chỉ thành công");
        } else {
          toast.error("Cập nhật thất bại");
          return;
        }
      } else {
        res = await createAddress(payload);
        if (res) {
          toast.success("Thêm địa chỉ thành công");
        } else {
          toast.error("Thêm thất bại");
          return;
        }
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
      console.error(error);
    }
  };

  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <p className="text-red-500 text-xs font-medium">
        {message}
      </p>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 sm:rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
        aria-describedby="form-desc"
      >
        <DialogHeader className="p-5 border-b bg-gray-50/50">
          <DialogTitle>
            {initialData ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
          </DialogTitle>
          <DialogDescription id="form-desc" className="sr-only">
            Form nhập thông tin
          </DialogDescription>
        </DialogHeader>

        <form className="overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={cn(errors.name && "text-red-500")}>
                  Họ tên
                </Label>
                <Input
                  {...register("name")}
                  className={cn(
                    errors.name && "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="Nguyễn Văn A"
                />
                {errors.name && <ErrorMessage message={errors.name.message} />}
              </div>
              <div className="space-y-1.5">
                <Label className={cn(errors.phone && "text-red-500")}>
                  Số điện thoại
                </Label>
                <Input
                  {...register("phone")}
                  className={cn(
                    errors.phone && "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="0123123123"
                />
                {errors.phone && <ErrorMessage message={errors.phone.message} />}
              </div>
            </div>

            <div className="border-t border-dashed"></div>

            <div className="space-y-1.5">
              <Label className={cn(errors.detail && "text-red-500")}>
                Địa chỉ chi tiết *
              </Label>
              <Input
                {...register("detail")}
                placeholder="Số nhà, tên đường, phường/xã..."
                className={cn(
                  errors.detail && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.detail && <ErrorMessage message={errors.detail.message} />}
            </div>

            <div className="grid gap-2 md:grid-cols-2 gap-y-3 gap-x-2">
              <div className="space-y-1.5">
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
                            placeholder="Tìm tỉnh..."
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

              <div className="space-y-1.5">
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
                          placeholder={!selectedProvince ? "Chọn tỉnh trước" : "Chọn quận"} 
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

            <div className="border-t border-dashed"></div>

            <div className="space-y-1.5">
              <Label>Loại địa chỉ</Label>
              <Controller
                control={control}
                name="addressType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn loại địa chỉ" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADDRESS_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon
                              size={16}
                              className="text-muted-foreground"
                            />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="default-chk"
                {...register("isDefault")}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              />
              <Label
                htmlFor="default-chk"
                className="font-normal cursor-pointer select-none"
              >
                Đặt làm địa chỉ mặc định
              </Label>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-gray-50/50 sm:justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Lưu địa chỉ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
