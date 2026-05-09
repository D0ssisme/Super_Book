import axios from "axios";
import useSWR from "swr";
import api from '@/lib/axios';
import { toast } from "sonner";
import { getJWTfromCookie } from "@/lib/cookies";
import { baseUrl } from "@/constants";

export function useUser() {
  const fetcher = async (url: string) => {
    // use centralized `api` so Authorization header is included automatically
    const path = url.replace(baseUrl, "");
    const res = await api.get(path);
    return res.data;
  };
  const { data, error, isLoading, mutate } = useSWR(`${baseUrl}/auth/profile`, fetcher);
  return {
    user: data,
    error,
    isLoading,
    mutate,
  };
}

export async function login(data: { username: string; password: string }) {
  try {
    const res = await axios.post(`${baseUrl}/auth/login`, data);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const errorData = err.response?.data;
      return {
        code: errorData?.code || "AXIOS_ERROR",
        message: errorData?.message || err.message,
      };
    }
    return { code: "UNKNOWN_ERROR", message: "Something went wrong" };
  }
}

export async function registerUser(data: {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  detail: string;
  province: string;
  district: string;
  password: string;
  confirmPassword: string;
}) {
  try {
    const res = await axios.post(`${baseUrl}/auth/register`, data);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const errorData = err.response?.data;
      return {
        code: errorData?.code || "AXIOS_ERROR",
        message: errorData?.message || err.message,
        errors: errorData?.errors || [],
      };
    }
    return {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong",
      errors: [],
    };
  }
}

export async function loginGoogle(code: string) {
  try {
    const res = await axios.post(`${baseUrl}/auth/google`, { code });
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        code: err.response?.data.code || "AXIOS_ERROR",
        message: err.response?.data.message || err,
      };
    }
    return { code: "UNKNOWN_ERROR", message: "Something went wrong" };
  }
}
export async function sendMailForgotPassword(email: string) {
  try {
    const res = await axios.post(`${baseUrl}/auth/forgot-password`, { email });
    toast.success(
      "Thư xác nhận thay đổi đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư rác",
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        code: err.response?.data.code || "AXIOS_ERROR",
        message: err.response?.data.message || err,
      };
    }
    return { code: "UNKNOWN_ERROR", message: "Something went wrong" };
  }
}

export async function resetPasswordAfterLogin(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const token = await getJWTfromCookie();
    const res = await axios.post(
      `${baseUrl}/auth/change-password`,
      {
        currentPassword,
        newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        code: err.response?.data.code || "AXIOS_ERROR",
        message: err.response?.data.message || err,
      };
    }
    return { code: "UNKNOWN_ERROR", message: "Something went wrong" };
  }
}

export async function updateProfile(data: {
  fullName: string;
  username: string;
  phone: string;
  email: string;
}) {
  try {
    const token = await getJWTfromCookie();
    const res = await axios.put(`${baseUrl}/auth/profile`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        code: err.response?.data.code || "AXIOS_ERROR",
        message: err.response?.data.message || err,
      };
    }
    return {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong",
    };
  }
}
