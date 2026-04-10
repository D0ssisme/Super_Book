"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ReviewStars } from "@/components/review/ReviewStars";
import { resolveImageUrl } from "@/utils/image-url";

interface ReviewFormValues {
  rating: number;
  content: string;
  images: string[];
}

interface LocalImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface ReviewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitText?: string;
  readOnly?: boolean;
  loading?: boolean;
  initialValues?: Partial<ReviewFormValues>;
  onSubmit?: (values: ReviewFormValues) => Promise<void>;
  onUploadImages?: (files: File[]) => Promise<string[]>;
  maxImages?: number;
}

export function ReviewFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitText = "Gửi đánh giá",
  readOnly = false,
  loading = false,
  initialValues,
  onSubmit,
  onUploadImages,
  maxImages = 6,
}: ReviewFormDialogProps) {
  const [rating, setRating] = useState<number>(initialValues?.rating ?? 5);
  const [content, setContent] = useState<string>(initialValues?.content ?? "");
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.images ?? []);
  const [localImageFiles, setLocalImageFiles] = useState<LocalImageFile[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [error, setError] = useState<string>("");

  const clearLocalImageFiles = () => {
    setLocalImageFiles((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  };

  useEffect(() => {
    if (!open) {
      clearLocalImageFiles();
      return;
    }

    setRating(initialValues?.rating ?? 5);
    setContent(initialValues?.content ?? "");
    setExistingImages(Array.isArray(initialValues?.images) ? initialValues.images : []);
    setError("");
  }, [open, initialValues?.rating, initialValues?.content, initialValues?.images]);

  useEffect(() => {
    return () => {
      clearLocalImageFiles();
    };
  }, []);

  const handleSelectImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) {
      return;
    }

    const remainSlots = maxImages - (existingImages.length + localImageFiles.length);
    if (remainSlots <= 0) {
      setError(`Bạn chỉ có thể tải tối đa ${maxImages} ảnh`);
      event.target.value = "";
      return;
    }

    const accepted = selectedFiles.slice(0, remainSlots);
    const nextLocalFiles: LocalImageFile[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setLocalImageFiles((prev) => [...prev, ...nextLocalFiles]);
    setError("");
    event.target.value = "";
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
  };

  const handleRemoveLocalImage = (id: string) => {
    setLocalImageFiles((prev) => {
      const deleting = prev.find((item) => item.id === id);
      if (deleting) {
        URL.revokeObjectURL(deleting.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!onSubmit || readOnly) {
      onOpenChange(false);
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Vui lòng chọn số sao hợp lệ");
      return;
    }

    setError("");

    let uploadedImages: string[] = [];
    const hasNewImages = localImageFiles.length > 0;

    if (hasNewImages && !onUploadImages) {
      setError("Chưa hỗ trợ tải ảnh ở màn hình này");
      return;
    }

    if (hasNewImages && onUploadImages) {
      try {
        setIsUploadingImages(true);
        uploadedImages = await onUploadImages(localImageFiles.map((item) => item.file));
      } catch (uploadError) {
        setError("Tải ảnh thất bại, vui lòng thử lại");
        setIsUploadingImages(false);
        return;
      }
      setIsUploadingImages(false);
    }

    await onSubmit({
      rating,
      content: content.trim(),
      images: [...existingImages, ...uploadedImages],
    });
  };

  const submitting = loading || isUploadingImages;
  const imageCount = existingImages.length + localImageFiles.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải đánh giá...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Số sao</Label>
              <ReviewStars
                value={rating}
                onChange={readOnly ? undefined : setRating}
                size={22}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-content">Nội dung đánh giá</Label>
              <Textarea
                id="review-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về cuốn sách này"
                className="min-h-[140px]"
                readOnly={readOnly}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 text-right">{content.length}/1000</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ảnh đánh giá</Label>
                <span className="text-xs text-gray-500">{imageCount}/{maxImages}</span>
              </div>

              {!readOnly ? (
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary/40 hover:text-primary transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  Thêm ảnh minh họa
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleSelectImages}
                  />
                </label>
              ) : null}

              {(existingImages.length > 0 || localImageFiles.length > 0) ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {existingImages.map((imageUrl) => (
                    <div key={imageUrl} className="relative h-16 w-16 rounded-md border overflow-hidden bg-gray-50">
                      <Image
                        src={resolveImageUrl(imageUrl)}
                        alt="review-image"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {!readOnly ? (
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5"
                          onClick={() => handleRemoveExistingImage(imageUrl)}
                          aria-label="Xoa anh"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>
                  ))}

                  {localImageFiles.map((item) => (
                    <div key={item.id} className="relative h-16 w-16 rounded-md border overflow-hidden bg-gray-50">
                      <Image
                        src={item.previewUrl}
                        alt="review-local-image"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {!readOnly ? (
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5"
                          onClick={() => handleRemoveLocalImage(item.id)}
                          aria-label="Xoa anh"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Chưa có ảnh đính kèm</p>
              )}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Đóng" : "Hủy"}
          </Button>
          {!readOnly ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {submitText}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
