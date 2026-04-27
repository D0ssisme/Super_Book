import axios from "axios";
import { getJWTfromCookie } from '@/lib/cookies';
import { baseUrl } from '@/constants';

const api = axios.create({
    baseURL : `${baseUrl}`,
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

export default api