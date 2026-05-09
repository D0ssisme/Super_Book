"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, AlertTriangle } from "lucide-react";
import { AddressCard } from "@/components/address/address-card";
import { CreateAddressModal } from "@/components/address/create-address-modal-simple";
import { Address } from '@/types/address.type';
import { getAllAddress, deleteAddress } from '@/services/addressservices';
import { toast } from 'sonner';

export default function AddressTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addresses, isLoading, mutate } = getAllAddress();

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleDelete = (addr: Address) => {
    setAddressToDelete(addr);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete?._id) return;
    
    setIsDeleting(true);
    try {
      await deleteAddress(addressToDelete._id);
      await mutate();
      toast.success("Xóa địa chỉ thành công");
      setIsDeleteConfirmOpen(false);
      setAddressToDelete(null);
    } catch (error) {
      toast.error("Xóa địa chỉ thất bại");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = async (addr: Address) => {
    setIsModalOpen(false);
    await mutate();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Card className="border-none shadow-none bg-transparent lg:bg-white lg:border lg:shadow-sm lg:rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-0 mb-4 lg:mb-0 lg:p-6 lg:border-b border-gray-100">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Sổ địa chỉ</CardTitle>
            <CardDescription className="mt-1">Quản lý danh sách địa chỉ nhận hàng của bạn</CardDescription>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-md hover:shadow-lg transition-shadow">
            <Plus className="mr-2 h-4 w-4" /> Thêm địa chỉ mới
          </Button>
        </div>

        <CardContent className="p-0 lg:p-6">
          <div className="grid gap-4">
            {isLoading ? (
              <p>Đang tải...</p>
            ) : (
              addresses
                ?.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                .map((addr: Address) => (
                  <AddressCard
                    key={addr._id}
                    data={addr}
                    onEdit={() => handleEdit(addr)}
                    onDelete={() => handleDelete(addr)}
                  />
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <CreateAddressModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingAddress}
          onSuccess={handleSuccess}
        />
      )}

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Xóa địa chỉ</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Bạn có chắc chắn muốn xóa địa chỉ này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          {addressToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Người nhận:</p>
                  <p className="text-gray-900">{addressToDelete.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Địa chỉ:</p>
                  <p className="text-gray-900">
                    {addressToDelete.detail}, {addressToDelete.district}, {addressToDelete.province}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Số điện thoại:</p>
                  <p className="text-gray-900">{addressToDelete.phone}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Đang xóa..." : "Xóa địa chỉ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}