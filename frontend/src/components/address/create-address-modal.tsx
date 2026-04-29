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
import { Textarea } from "@/components/ui/textarea";
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
  Map as MapIcon,
  MapPin,
} from "lucide-react";
import { AddressComponent, MapPickerModal } from "./map-picker-modal";
import { Controller, useForm, SubmitErrorHandler } from "react-hook-form"; // Import SubmitErrorHandler
import { zodResolver } from "@hookform/resolvers/zod";
import { Address, addressSchema } from "@/types/address.type";
import { cn, normalizeString } from "@/lib/utils";
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
  initialData?: Address | null; // <--- Dữ liệu cần sửa (nếu có)
  onSuccess?: (addr: Address) => void; // <--- Hàm gọi lại khi thành công để reload list
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
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [districts, setDistricts] = useState<Province[]>([]);
  const [pendingMapAddress, setPendingMapAddress] = useState<
    AddressComponent[] | null
  >(null);
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    watch,
  } = useForm<Address>({
    defaultValues: {
      _id: initialData?._id,
      name: "",
      phone: "",
      province: "",
      district: "",
      detail: "",
      addressType: "Nhà riêng",
      isDefault: false,
    },
    resolver: zodResolver(addressSchema),
    mode: "onChange",
  });

  const { provinces, isLoading: isLoadingProvinces } = getProvinces();
  const detailValue = watch("detail");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // TRƯỜNG HỢP SỬA:
        const provinceObj = provinces?.find(
          (p) => p.name === initialData.province,
        );
        const provinceId = provinceObj?.id || "";

        if (provinceId) {
          getDistricts(provinceId).then((res) => setDistricts(res));
        }
        setValue("name", initialData.name);
        setValue("phone", initialData.phone);
        setValue("province", String(provinceId || ""));
        setValue("district", String(initialData.district || ""));
        setValue("detail", initialData.detail);
        setValue("addressType", initialData.addressType);
        setValue("isDefault", initialData.isDefault);
      } else {
        // Do not reset when form already has values (e.g. auto-filled from map/detail parsing).
        if (
          getValues("detail") ||
          getValues("province") ||
          getValues("district")
        ) {
          return;
        }

        setValue("name", user?.data?.fullName || "");
        setValue("phone", user?.data?.phone || "");
        setValue("province", "");
        setValue("district", "");
        setValue("detail", "");
        setValue("addressType", "Nhà riêng");
        setValue("isDefault", false);
        setDistricts([]);
      }
    }
  }, [isOpen, initialData, provinces, setValue, user, getValues]);

  useEffect(() => {
    if (!pendingMapAddress || !provinces?.length) return;

    const run = async () => {
      const queuedAddress = pendingMapAddress;
      setPendingMapAddress(null);
      await handleMapConfirm(queuedAddress);
    };

    run();
  }, [pendingMapAddress, provinces]);

  const normalizeAdminName = (value: string) => {
    const base = normalizeString(value || "")
      .toLowerCase()
      .trim();
    return base
      .replace(/^(tinh|thanh pho|tp\.?|tp)\s+/g, "")
      .replace(/^(quan|huyen|thi xa|tx\.?|thanh pho)\s+/g, "")
      .replace(/\b(city|province|state|district)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const detailRegister = register("detail");

  const plainNormalize = (value: string) =>
    (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .trim();

  const extractAdminPartsFromDetail = (rawAddress: string) => {
    const parts = rawAddress
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const hasProvinceKeyword = (text: string) =>
      /(tinh|thanh pho|tp\.?|city|province)/i.test(plainNormalize(text));

    const hasWardKeyword = (text: string) =>
      /(phuong|xa|thi tran|ward|commune)/i.test(plainNormalize(text));

    const hasDistrictKeyword = (text: string) =>
      /(quan|huyen|thi xa|district)/i.test(plainNormalize(text));

    const provincePart =
      [...parts].reverse().find((p) => hasProvinceKeyword(p)) || "";

    const wardOrDistrictPart =
      parts.find((p) => hasWardKeyword(p)) ||
      parts.find((p) => hasDistrictKeyword(p)) ||
      "";

    return { provincePart, wardOrDistrictPart };
  };

  const findBestProvinceFromText = (rawAddress: string) => {
    if (!provinces?.length) return undefined;

    const normalizedAddress = normalizeAdminName(rawAddress);
    const candidates = provinces
      .map((p) => {
        const fullName = normalizeAdminName(p.full_name);
        const name = normalizeAdminName(p.name);
        const matchedLength = Math.max(
          normalizedAddress.includes(fullName) ? fullName.length : 0,
          normalizedAddress.includes(name) ? name.length : 0,
        );
        return { province: p, matchedLength };
      })
      .filter((c) => c.matchedLength > 0)
      .sort((a, b) => b.matchedLength - a.matchedLength);

    return candidates[0]?.province;
  };

  const findBestDistrictFromText = (rawAddress: string, items: Province[]) => {
    if (!items.length) return undefined;

    const normalizedAddress = normalizeAdminName(rawAddress);
    const candidates = items
      .map((d) => {
        const fullName = normalizeAdminName(d.full_name);
        const name = normalizeAdminName(d.name);
        const matchedLength = Math.max(
          normalizedAddress.includes(fullName) ? fullName.length : 0,
          normalizedAddress.includes(name) ? name.length : 0,
        );
        return { district: d, matchedLength };
      })
      .filter((c) => c.matchedLength > 0)
      .sort((a, b) => b.matchedLength - a.matchedLength);

    return candidates[0]?.district;
  };

  const autoFillFromTypedAddress = async (rawAddress: string) => {
    if (!rawAddress?.trim() || !provinces?.length) return;

    const { provincePart, wardOrDistrictPart } =
      extractAdminPartsFromDetail(rawAddress);

    const province =
      findBestProvinceFromText(provincePart) ||
      findBestProvinceFromText(rawAddress);
    if (!province?.id) return;

    setValue("province", String(province.id), { shouldValidate: true });

    const districtList = await getDistricts(String(province.id));
    setDistricts(districtList || []);

    const district =
      findBestDistrictFromText(wardOrDistrictPart, districtList || []) ||
      findBestDistrictFromText(rawAddress, districtList || []);
    if (district?.id) {
      setValue("district", String(district.id), { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (!detailValue?.trim()) return;
    if (!provinces?.length) return;

    const provinceSelected = getValues("province");
    const districtSelected = getValues("district");
    if (provinceSelected && districtSelected) return;

    autoFillFromTypedAddress(detailValue);
  }, [detailValue, provinces]);

  const handleMapConfirm = async (address: AddressComponent[]) => {
    if (!provinces?.length) {
      const addressDetails = address
        .map((a) => a.name)
        .filter(Boolean)
        .join(", ");
      if (addressDetails) {
        setValue("detail", addressDetails, { shouldValidate: true });
      }
      setPendingMapAddress(address);
      toast.info("Dang tai du lieu tinh/thanh, he thong se tu dong cap nhat.");
      return;
    }

    const normalizedComponents = address.map((item) => ({
      ...item,
      type: item.types?.[0] || "",
      normalizedName: normalizeAdminName(item.name),
    }));

    const provinceCandidates = normalizedComponents.filter((a) =>
      [
        "admin_level_1",
        "admin_level_2",
        "administrative_area_level_1",
        "political",
      ].includes(a.type),
    );

    const findProvinceMatch = (targetName: string) => {
      const target = normalizeAdminName(targetName);
      if (!target) return undefined;

      return provinces?.find((p) => {
        const fullName = normalizeAdminName(p.full_name);
        const name = normalizeAdminName(p.name);
        return (
          fullName === target ||
          name === target ||
          fullName.includes(target) ||
          target.includes(fullName) ||
          name.includes(target) ||
          target.includes(name)
        );
      });
    };

    const fuzzyProvinceMatch = () => {
      const allTokens = new Set(
        normalizedComponents
          .flatMap((c) => normalizeAdminName(c.name).split(" "))
          .filter((t) => t && t.length > 1),
      );

      if (allTokens.size === 0 || !provinces?.length) return undefined;

      const scored = provinces.map((p) => {
        const candidate =
          `${normalizeAdminName(p.full_name)} ${normalizeAdminName(p.name)}`
            .split(" ")
            .filter((t) => t && t.length > 1);
        const score = candidate.reduce(
          (acc, token) => acc + (allTokens.has(token) ? 1 : 0),
          0,
        );
        return { province: p, score };
      });

      const best = scored.sort((a, b) => b.score - a.score)[0];
      return best?.score > 0 ? best.province : undefined;
    };

    let provinceMatch = provinceCandidates
      .map((c) => findProvinceMatch(c.name))
      .find(Boolean);

    // Fallback: thử match từ mọi thành phần địa chỉ nếu type không chuẩn.
    if (!provinceMatch) {
      provinceMatch = normalizedComponents
        .map((c) => findProvinceMatch(c.name))
        .find(Boolean);
    }

    if (!provinceMatch) {
      provinceMatch = fuzzyProvinceMatch();
    }

    const addressDetails = address.filter(
      (d) =>
        d.types?.[0] !== "admin_level_1" &&
        d.types?.[0] !== "admin_level_2" &&
        d.types?.[0] !== "admin_level_3" &&
        d.types?.[0] !== "admin_level_4" &&
        d.types?.[0] !== "administrative_area_level_1" &&
        d.types?.[0] !== "administrative_area_level_2",
    );
    const addressDetail = addressDetails.map((a) => a.name).join(", ");
    setValue("detail", addressDetail, { shouldValidate: true });

    const normalizedFullAddress = normalizeAdminName(
      address
        .map((a) => a.name)
        .filter(Boolean)
        .join(" "),
    );

    if (!provinceMatch?.id && provinces?.length) {
      const provinceFromText = provinces
        .map((p) => ({
          province: p,
          fullName: normalizeAdminName(p.full_name),
          name: normalizeAdminName(p.name),
        }))
        .filter(
          (p) =>
            (p.fullName && normalizedFullAddress.includes(p.fullName)) ||
            (p.name && normalizedFullAddress.includes(p.name)),
        )
        .sort(
          (a, b) =>
            Math.max(b.fullName.length, b.name.length) -
            Math.max(a.fullName.length, a.name.length),
        )[0]?.province;

      if (provinceFromText) {
        provinceMatch = provinceFromText;
      }
    }

    if (!provinceMatch?.id) {
      const existingProvinceId = getValues("province");
      provinceMatch =
        provinces?.find((p) => p.id === existingProvinceId) || provinces?.[0];

      if (!provinceMatch?.id) {
        toast.warning(
          "Khong tim thay du lieu tinh/thanh. Vui long thu lai sau.",
        );
        return;
      }

      toast.info("Da tu dong chon tinh/thanh mac dinh de tiep tuc.");
    }

    setValue("province", String(provinceMatch.id), { shouldValidate: true });
    const districts = await getDistricts(String(provinceMatch.id));
    setDistricts(districts);

    const districtFromMap = normalizedComponents.find((d) =>
      [
        "admin_level_3",
        "admin_level_4",
        "administrative_area_level_2",
        "locality",
        "suburb",
      ].includes(d.type),
    );

    const districtMatch = districts?.find((d) => {
      const fullName = normalizeAdminName(d.full_name);
      const name = normalizeAdminName(d.name);
      const target = normalizeAdminName(districtFromMap?.name || "");
      return (
        fullName === target ||
        name === target ||
        fullName.includes(target) ||
        target.includes(fullName) ||
        name.includes(target) ||
        target.includes(name)
      );
    });

    if (districtMatch?.id) {
      setValue("district", String(districtMatch.id), { shouldValidate: true });
    } else {
      const districtFromText = districts
        ?.map((d) => ({
          district: d,
          fullName: normalizeAdminName(d.full_name),
          name: normalizeAdminName(d.name),
        }))
        .filter(
          (d) =>
            (d.fullName && normalizedFullAddress.includes(d.fullName)) ||
            (d.name && normalizedFullAddress.includes(d.name)),
        )
        .sort(
          (a, b) =>
            Math.max(b.fullName.length, b.name.length) -
            Math.max(a.fullName.length, a.name.length),
        )[0]?.district;

      setValue(
        "district",
        districtFromText?.id
          ? String(districtFromText.id)
          : districts?.[0]?.id
            ? String(districts[0].id)
            : "",
        {
          shouldValidate: true,
        },
      );
    }
  };

  const onSubmit = async (data: Address) => {
    const detailText = (data.detail || "").trim();
    const { provincePart, wardOrDistrictPart } =
      extractAdminPartsFromDetail(detailText);

    const provinceByText = findBestProvinceFromText(detailText);
    const provinceById = provinces?.find(
      (item) => String(item.id) === String(data.province),
    );

    const resolvedProvince =
      provincePart ||
      provinceById?.full_name ||
      provinceById?.name ||
      provinceByText?.full_name ||
      provinceByText?.name ||
      "Khac";

    let resolvedDistrict =
      wardOrDistrictPart || (data.district ? String(data.district) : "");

    if (!wardOrDistrictPart && (provinceById?.id || provinceByText?.id)) {
      try {
        const districtList = await getDistricts(
          String(provinceById?.id || provinceByText?.id),
        );
        const districtByText = findBestDistrictFromText(
          detailText,
          districtList || [],
        );
        if (districtByText?.name) {
          resolvedDistrict = districtByText.name;
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (!resolvedDistrict) {
      resolvedDistrict = "Khac";
    }

    const payload = {
      ...data,
      province: resolvedProvince,
      district: resolvedDistrict,
    };

    let res;
    if (initialData?._id) {
      res = await updateAddress(payload);
      if (res) toast.success("Cập nhật địa chỉ thành công");
      else toast.error("Cập nhật thất bại");
    } else {
      res = await createAddress(payload);
      if (res) toast.success("Thêm địa chỉ thành công");
      else toast.error("Thêm thất bại");
    }

    // Gọi callback onSuccess để component cha reload lại list
    if (res && onSuccess) {
      onSuccess(data);
    }

    onClose();
  };
  const onError: SubmitErrorHandler<Address> = (errors) => {
    console.log("SUBMIT ERROR (Validation):", errors);
  };

  return (
    <>
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

          <form>
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={cn(errors.name && "text-red-500")}>
                    Họ tên
                  </Label>
                  <Input
                    {...register("name")}
                    className={cn(
                      errors.name &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs font-medium animate-in fade-in-50 slide-in-from-top-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className={cn(errors.phone && "text-red-500")}>
                    Số điện thoại
                  </Label>
                  <Input
                    {...register("phone")}
                    className={cn(
                      errors.phone &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                    placeholder="0123123123"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs font-medium animate-in fade-in-50 slide-in-from-top-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed"></div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">
                    Địa chỉ nhận hàng
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/5 h-8 gap-2 border-primary/20"
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                  >
                    <MapIcon size={14} />{" "}
                    {isLoadingProvinces
                      ? "Đang tải tỉnh..."
                      : "Chọn trên bản đồ"}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label>Địa chỉ chi tiết</Label>
                  <Textarea
                    {...detailRegister}
                    onBlur={async (e) => {
                      detailRegister.onBlur(e);
                      await autoFillFromTypedAddress(e.target.value);
                    }}
                    placeholder="Số nhà, tên đường, phường/xã..."
                    className={cn(
                      "min-h-[80px] resize-none",
                      errors.detail && "border-red-500",
                    )}
                  />
                  {errors.detail && (
                    <p className="text-red-500 text-xs">
                      {errors.detail.message}
                    </p>
                  )}
                </div>
              </div>

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
                onClick={handleSubmit(onSubmit, onError)}
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

      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
        setDistricts={setDistricts}
      />
    </>
  );
};
