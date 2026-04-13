"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReviewItem } from "@/types/review.type";

interface ReviewModerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: ReviewItem | null;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function ReviewModerationDialog({
  open,
  onOpenChange,
  review,
  reason,
  onReasonChange,
  onConfirm,
  loading = false,
  error,
}: ReviewModerationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ẩn đánh giá</DialogTitle>
          <DialogDescription>
            Nhập lý do để khách hàng hiểu vì sao đánh giá bị ẩn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Sản phẩm: {review?.book.name || "-"}</p>
            <p className="mt-1 line-clamp-3">Nội dung: {review?.content || "(Không có nội dung)"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hidden-reason">Lý do kiểm duyệt</Label>
            <Textarea
              id="hidden-reason"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Ví dụ: Nội dung chứa từ ngữ không phù hợp..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{reason.trim().length}/500</p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Xác nhận ẩn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
