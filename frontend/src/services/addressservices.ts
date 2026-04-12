import useSWR from "swr";
import { Address } from "@/types/address.type";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import { AddressComponent } from "@/components/address/map-picker-modal";

interface LocationItem {
  error: number;
  error_text: string;
  data_name: string;
  data: Province[];
}
export interface Province {
  id: string;
  name: string;
  full_name: string;
}
export function getProvinces() {
  const { data, error, isLoading, mutate } = useSWR<LocationItem>(
    `${process.env.NEXT_PUBLIC_API_URL}/address/provinces`,
  );
  return {
    provinces: data?.data,
    error,
    isLoading,
    mutate,
  };
}
export function getAllAddress() {
  const { data, error, isLoading, mutate } = useSWR<Address[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/address`,
  );
  return {
    addresses: data,
    error,
    isLoading,
    mutate,
  };
}
export async function getDistricts(id: string): Promise<Province[]> {
  return api
    .get(`${process.env.NEXT_PUBLIC_API_URL}/address/districts/${id}`)
    .then((res) => {
      return res.data?.data;
    });
}

export async function createAddress(data: Address) {
  return api.post(`/address`, data).then((res) => {
    return res.data;
  });
}
export async function updateAddress(data: Address) {
  return api.put(`/address/${data._id}`, data).then((res) => {
    return res.data;
  });
}
export async function deleteAddress(id: string) {
  return api.delete(`/address/${id}`).then((res) => {
    return res.data;
  });
}

export async function getAddressFromLatLog(
  latitue: number | null,
  longtitue: number | null,
) {
  if (latitue == null || longtitue == null) return null;

  const map4dKey =
    process.env.NEXT_PUBLIC_MAP4D_KEY || "905b71a5cd84156325aa6259e3f31ec9";

  return api
    .get(
      `https://api.map4d.vn/sdk/v2/geocode?key=${map4dKey}&location=${latitue},${longtitue}`,
    )
    .then((res) => {
      const results = res?.data?.result;
      if (!Array.isArray(results) || results.length === 0) return null;
      return results[0] ?? null;
    })
    .catch((error: AxiosError) => {
      console.error(error.message);
      return null;
    });
}

function mapNominatimAddressToComponents(address: any): AddressComponent[] {
  if (!address) return [];

  const components: AddressComponent[] = [];
  const province =
    address.state || address.city || address.province || address.region;
  const district =
    address.city_district || address.county || address.district || address.town;
  const ward =
    address.suburb ||
    address.quarter ||
    address.neighbourhood ||
    address.village;
  const road = address.road || address.pedestrian;
  const houseNumber = address.house_number;

  if (province) components.push({ types: ["admin_level_1"], name: province });
  if (district) components.push({ types: ["admin_level_3"], name: district });
  if (ward) components.push({ types: ["locality"], name: ward });
  if (road) components.push({ types: ["route"], name: road });
  if (houseNumber)
    components.push({ types: ["street_number"], name: houseNumber });

  return components;
}

export async function reverseGeocodeByLatLngFree(
  lat: number,
  lng: number,
): Promise<{
  lat: number;
  lng: number;
  addressComponents: AddressComponent[];
} | null> {
  try {
    const res = await api.get(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const addressComponents = mapNominatimAddressToComponents(
      res?.data?.address,
    );
    return {
      lat,
      lng,
      addressComponents,
    };
  } catch (error) {
    console.error("reverseGeocodeByLatLngFree error", error);
    return null;
  }
}

export async function searchAddressByTextFree(query: string): Promise<{
  lat: number;
  lng: number;
  addressComponents: AddressComponent[];
} | null> {
  try {
    const res = await api.get(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const first = Array.isArray(res?.data) ? res.data[0] : null;
    if (!first?.lat || !first?.lon) return null;

    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
      addressComponents: mapNominatimAddressToComponents(first.address),
    };
  } catch (error) {
    console.error("searchAddressByTextFree error", error);
    return null;
  }
}
