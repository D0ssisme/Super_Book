"use client";

import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { MFMap } from "react-map4d-map";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce, useGeolocation } from "react-haiku";
import { MapPin } from "./svg/map-pin";
import {
  getAddressFromLatLog,
  getDistricts,
  getProvinces,
  Province,
  reverseGeocodeByLatLngFree,
  searchAddressByTextFree,
} from "@/services/addressservices";
import { AddressComponent } from "./address/map-picker-modal";
import { toast } from "sonner";
interface Position {
  lat: number | null;
  lng: number | null;
}

const FALLBACK_CENTER = {
  lat: 10.7769,
  lng: 106.7009,
};

const Map = memo(
  ({
    latitude,
    longitude,
    handleCameraChanging,
    handleMapReady,
  }: {
    latitude: number | null;
    longitude: number | null;
    handleCameraChanging: ((args: any) => void) | undefined;
    handleMapReady?: () => void;
  }) => {
    const initialLat = latitude ?? FALLBACK_CENTER.lat;
    const initialLng = longitude ?? FALLBACK_CENTER.lng;

    return (
      <MFMap
        options={{
          center: { lat: initialLat, lng: initialLng },
          zoom: 16,
          controls: true,
          geolocate: true,
        }}
        version="2.4"
        accessKey={
          process.env.NEXT_PUBLIC_MAP4D_KEY ||
          "905b71a5cd84156325aa6259e3f31ec9"
        }
        onCameraChanging={handleCameraChanging}
        onMapReady={handleMapReady}
      />
    );
  },
);

function Map4DAutoSuggest({
  setAddressName,
  setDistricts,
}: {
  setAddressName: React.Dispatch<React.SetStateAction<AddressComponent[]>>;
  setDistricts: React.Dispatch<Province[]>;
}) {
  const { latitude, longitude, loading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });
  const [mapCenter, setMapCenter] = useState<Position>({
    lat: FALLBACK_CENTER.lat,
    lng: FALLBACK_CENTER.lng,
  });
  const [position, setPosition] = useState<Position>({
    lat: FALLBACK_CENTER.lat,
    lng: FALLBACK_CENTER.lng,
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapFailed, setIsMapFailed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const hasUserMovedMapRef = useRef(false);
  const debouncedPosition = useDebounce(position, 1000);
  const { provinces } = getProvinces();

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    if (hasUserMovedMapRef.current) return;

    const next = { lat: latitude, lng: longitude };
    setMapCenter(next);
    setPosition(next);
  }, [latitude, longitude]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!isMapReady) setIsMapFailed(true);
    }, 7000);

    return () => window.clearTimeout(timeoutId);
  }, [isMapReady]);

  const handleCameraChanging = useCallback((event: any) => {
    const target = event.camera.target;
    hasUserMovedMapRef.current = true;
    setPosition({ lat: target.lat, lng: target.lng });
  }, []);

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    setIsMapFailed(false);
  }, []);

  useEffect(() => {
    if (debouncedPosition.lat == null || debouncedPosition.lng == null) return;
    const fetchAddress = async () => {
      try {
        const geocodeResult = await getAddressFromLatLog(
          debouncedPosition.lat,
          debouncedPosition.lng,
        );

        const fallbackResult =
          !geocodeResult?.addressComponents ||
          geocodeResult.addressComponents.length === 0
            ? await reverseGeocodeByLatLngFree(
                debouncedPosition.lat,
                debouncedPosition.lng,
              )
            : null;

        const address: AddressComponent[] =
          geocodeResult?.addressComponents ||
          fallbackResult?.addressComponents ||
          [];
        if (address.length === 0) return;

        setAddressName(address);
        const province = address.find(
          (a) =>
            a.types?.[0] == "admin_level_1" ||
            a.types?.[0] == "admin_level_2" ||
            a.types?.[0] == "administrative_area_level_1",
        );
        const provinceId = provinces?.find(
          (p) => p.full_name == province?.name || p.name == province?.name,
        )?.id;
        if (!provinceId) return;

        const district = await getDistricts(provinceId!);
        setDistricts(district);
      } catch (err) {
        console.error("Error fetching address:", err);
      }
    };
    fetchAddress();
  }, [debouncedPosition, provinces, setAddressName, setDistricts]);

  const handleSearchByText = useCallback(async () => {
    if (!searchText.trim()) return;
    setIsSearching(true);
    try {
      const result = await searchAddressByTextFree(searchText.trim());
      if (!result) {
        toast.error(
          "Khong tim thay dia chi. Vui long thu lai voi mo ta ro hon.",
        );
        return;
      }

      hasUserMovedMapRef.current = true;
      const next = { lat: result.lat, lng: result.lng };
      setMapCenter(next);
      setPosition(next);
      setAddressName(result.addressComponents);
      toast.success("Da tim thay vi tri tu dia chi nhap vao.");
    } catch (error) {
      console.error(error);
      toast.error("Khong the tim vi tri tu dia chi vua nhap");
    } finally {
      setIsSearching(false);
    }
  }, [searchText, setAddressName]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
        <span className="text-sm font-medium">Đang lấy vị trí của bạn...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="relative z-[50]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-9 bg-white shadow-sm"
            placeholder="Nhap dia chi roi nhan Enter de tim nhanh"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchByText();
              }
            }}
            disabled={loading || isSearching}
          />
          {(isSearching || loading) && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {isMapFailed && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Ban do key hien tai khong tai duoc. Ban van co the nhap dia chi o o
          tim kiem ben tren de tiep tuc demo.
        </div>
      )}

      <div className="flex-1 relative border rounded-md overflow-hidden min-h-[300px] bg-gray-100 group">
        {!isMapFailed && (
          <Map
            latitude={mapCenter.lat}
            longitude={mapCenter.lng}
            handleCameraChanging={handleCameraChanging}
            handleMapReady={handleMapReady}
          />
        )}
        {!loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[40] pointer-events-none pb-[38px]">
            <MapPin
              size={40}
              className={cn(
                "drop-shadow-xl text-red-600",
                loading ? "animate-bounce" : "",
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Map4DAutoSuggest;
