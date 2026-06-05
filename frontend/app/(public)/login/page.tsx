"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function Login() {
    const router = useRouter();
    const { login, checkEmail, checkPassword, isLoading, error } = useAuth();
    // Quản lý trạng thái disabled (mặc định là true - bị khóa)
    const [isPassDisabled, setIsPassDisabled] = useState(true);
    const [isBtnDisabled, setIsBtnDisabled] = useState(true);

    // Tạo Ref để điều khiển việc bôi đen text
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            // 3. Gọi hàm login từ Hook
            const user = await login(data);
            // Điều hướng sang trang home nếu đăng nhập thành công
            router.push("/");
        } catch (err) {
            // Lỗi đã được Hook xử lý và lưu vào biến 'error', 
            // ở đây chỉ catch để tránh crash ứng dụng.
            console.error("Login failed:", err);
        }
    };

    const handleEmailKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "Tab") {
            const email = e.currentTarget.value;
            try {
                // Đợi Service kiểm tra email
                await checkEmail(email);

                // Nếu đúng, mở khóa ô Pass
                setIsPassDisabled(false);
                // Bạn có thể cho phép focus tự động nhảy xuống bằng cách không preventDefault
            } catch (err) {
                e.preventDefault(); // Chặn không cho nhảy sang ô Pass
                emailRef.current?.select(); // Bôi đen để nhập lại
                // Error đã được Hook hiển thị qua biến 'error'
            }
        }
    };
    const handlePasswordKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "Tab") {
            const email = emailRef.current?.value || "";
            const password = e.currentTarget.value;

            try {
                await checkPassword({ email, password });
                setIsBtnDisabled(false); // Mở khóa nút Login
            } catch (err) {
                e.preventDefault();
                passwordRef.current?.select(); // Bôi đen mật khẩu sai
            }
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-rose-50 via-pink-50 to-red-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-linear-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        Welcome
                    </h1>
                    <p className="text-gray-600 text-lg">Sign in to your account</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-rose-100">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-800 text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                placeholder="Enter your email"
                                ref={emailRef}
                                onKeyDown={handleEmailKeyDown}
                                className="w-full px-4 py-3 border-2 border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all bg-white text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">Nhấn Enter/Tab để kiểm tra</p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                placeholder="Enter your password"
                                ref={passwordRef}
                                onKeyDown={handlePasswordKeyDown}
                                disabled={isPassDisabled}
                                className="w-full px-4 py-3 border-2 border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all bg-white text-gray-900 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {isPassDisabled ? "Hãy verify email trước" : "Nhấn Enter/Tab để kiểm tra"}
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            disabled={isBtnDisabled || isLoading}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-gray-600 text-sm">
                            Don&apos;t have an account?{" "}
                            <span className="text-rose-600 font-semibold cursor-pointer hover:text-rose-700">
                                Sign up
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}