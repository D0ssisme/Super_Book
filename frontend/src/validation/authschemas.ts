import { z } from "zod";
export const LoginRequestSchema = z.object({
    username: z.string().min(1, "Tên đăng nhập không được để trống").max(50, "Tên đăng nhập tối đa 50 ký tự"),
    password: z.string().min(6, "Mật khẩu chứa ít nhất 6 ký tự").max(100, "Mật khẩu tối đa 100 ký tự"),
})
export const RegisterRequestSchema = z.object({
    fullName: z.string().min(1, "Họ và tên không được để trống").max(100, "Họ và tên tối đa 100 ký tự"),
    username: z.string().min(1, "Tên đăng nhập không được để trống").max(50, "Tên đăng nhập tối đa 50 ký tự"),
    phone: z.string()
        .regex(/^0\d{9}$/, "Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số")
        .min(10, "Số điện thoại không hợp lệ")
        .max(20, "Số điện thoại không hợp lệ"),
    email: z.string().email("Email không hợp lệ").max(100, "Email tối đa 100 ký tự"),
    detail: z.string().min(1, "Nhập địa chỉ chi tiết").max(255, "Tối đa 255 ký tự"),
    province: z.string().min(1, "Chọn tỉnh/thành phố").max(100, "Tối đa 100 ký tự"),
    district: z.string().min(1, "Chọn quận/huyện"),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự").max(100, "Mật khẩu tối đa 100 ký tự"),
    confirmPassword: z.string().min(1, "Nhập lại mật khẩu").max(100, "Mật khẩu tối đa 100 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
});