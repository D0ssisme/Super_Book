import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../ui/button';
import { loginGoogle, useUser } from '@/services/authservices';
import { setJWTtoCookie } from '@/lib/cookies';
import { GoogleIcon } from '@/components/svg/google';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/useCartStore';

export const ButtonLoginGoogle = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { mutate } = useUser();
  const { onLoginSuccess } = useCartStore();
  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      const response = await loginGoogle(code);
      await setJWTtoCookie(response.data.token);
      await mutate();      
      // Auto-merge guest cart with user cart on Google login
      try {
        await onLoginSuccess();
      } catch (error) {
        console.error("Cart merge error during Google login:", error);
        // Don't block login if cart merge fails
      }
            toast.success('Đăng nhập thành công');
      onSuccess?.();
    },
    flow: 'auth-code'
  });
  return (
    <Button variant="outline" className="w-full mb-4" onClick={googleLogin}>
      <GoogleIcon />
      Đăng nhập với Google
    </Button>
  );
};
