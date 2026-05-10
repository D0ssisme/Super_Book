import axios from "axios";
import { getJWTfromCookie } from '@/lib/cookies';
import { baseUrl } from '@/constants';
import { notifyAccountLocked } from '@/lib/account-lock';

const api = axios.create({
    baseURL: `${baseUrl}`,
});

api.interceptors.request.use(
    async (config) => {
        const token = await getJWTfromCookie();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add guest session ID for cart operations (if not already authenticated)
        if (!token && typeof window !== 'undefined') {
            const guestSessionId = localStorage.getItem('guest_session_id');
            if (guestSessionId) {
                config.headers["X-Guest-Session-Id"] = guestSessionId;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 403 &&
            error.response.data?.code === "ACCOUNT_LOCKED"
        ) {
            notifyAccountLocked(error.response.data?.message);
        }

        return Promise.reject(error);
    }
);

export default api