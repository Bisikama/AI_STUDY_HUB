"use client";

import { useState } from "react";
import Link from "next/link";

export default function Welcome() {
    const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        Welcome! 👋
                    </h1>
                    <p className="text-gray-600 text-xl">You've successfully logged in</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-12 border-2 border-rose-100">
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full mb-4">
                                <span className="text-4xl">✨</span>
                            </div>
                            <p className="text-lg text-gray-700 font-semibold">Great to see you here!</p>
                            <p className="text-gray-600 mt-2">This is your welcome page after successful login.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-rose-50 rounded-lg border border-rose-100 hover:border-rose-300 transition-colors">
                                <div className="text-2xl mb-2">📊</div>
                                <h3 className="font-semibold text-gray-900 mb-1">Dashboard</h3>
                                <p className="text-sm text-gray-600">View your statistics</p>
                            </div>

                            <div className="p-4 bg-pink-50 rounded-lg border border-pink-100 hover:border-pink-300 transition-colors">
                                <div className="text-2xl mb-2">⚙️</div>
                                <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
                                <p className="text-sm text-gray-600">Manage your account</p>
                            </div>

                            <div className="p-4 bg-red-50 rounded-lg border border-red-100 hover:border-red-300 transition-colors">
                                <div className="text-2xl mb-2">ℹ️</div>
                                <h3 className="font-semibold text-gray-900 mb-1">Help</h3>
                                <p className="text-sm text-gray-600">Get support</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/login"
                                    className="flex-1 py-3 px-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                                >
                                    Back to Login
                                </Link>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("user");
                                        window.location.href = "/login";
                                    }}
                                    className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-gray-600 text-sm">
                        © 2026 Login App. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
