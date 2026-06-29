'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import axiosClient from '@/utils/axios';
import TeacherVerificationModal from '@/components/TeacherVerificationModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [search, setSearch] = useState('');
  const [userFullName, setUserFullName] = useState('User');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj && userObj.fullName) {
          setUserFullName(userObj.fullName);
        }
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-background text-on-background flex min-h-screen font-sans">
      {/* Sidebar Nav */}
      <nav
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } border-outline-variant bg-surface-container-lowest fixed top-0 left-0 z-20 h-full w-64 flex-col border-r p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all md:flex`}
      >
        <div className="mt-2 mb-8 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <div>
              <h1 className="font-headline-md text-headline-md text-primary font-bold">
                ScholarHub
              </h1>
              <p className="font-label-sm text-label-sm text-secondary text-[10px] tracking-wider uppercase">
                Academic Excellence
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-secondary hover:text-primary p-1 md:hidden"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-6 px-4">
          <Link
            href="/explore"
            className="font-label-md text-label-md flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a1c23] px-4 py-3 text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined">add</span> New Research
          </Link>
        </div>

        <ul className="flex flex-grow flex-col gap-2">
          <li>
            <Link
              href="/dashboard"
              className={`font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95 ${
                pathname === '/dashboard'
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-secondary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">search</span> Discover
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/documents"
              className={`font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95 ${
                pathname.includes('/dashboard/documents')
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-secondary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">description</span> My Documents
            </Link>
          </li>
          <li>
            <Link
              href="/practice"
              className={`font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95 ${
                pathname.includes('/practice')
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-secondary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">lightbulb</span> Practice Mode
            </Link>
          </li>
        </ul>

        <ul className="border-outline-variant mt-auto flex flex-col gap-2 border-t pt-4">
          <li>
            <button
              onClick={() => alert('Settings clicked (Simulated)')}
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">settings</span> Settings
            </button>
          </li>
          <li>
            <button
              onClick={() => alert('Help clicked (Simulated)')}
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">help</span> Help
            </button>
          </li>
          <li>
            <a
              className="text-error font-label-md text-label-md flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-transform hover:bg-red-50 hover:text-rose-700 active:scale-95"
              href="#"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined text-error">logout</span> Đăng xuất
            </a>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <div className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden md:ml-64">
        {/* Top Header */}
        <header className="bg-surface sticky top-0 z-10 w-full shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
          <div className="px-container-margin-desktop max-w-max-width mx-auto flex h-16 w-full items-center justify-between">
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-primary hover:text-secondary cursor-pointer p-2 transition-colors"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <span className="font-headline-md text-headline-md text-primary">ScholarHub</span>
            </div>

            {/* Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative mx-8 hidden max-w-2xl flex-1 md:flex"
            >
              <span className="material-symbols-outlined text-secondary absolute top-1/2 left-4 -translate-y-1/2">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-container-low text-on-surface focus:ring-primary focus:bg-surface-container-lowest font-body-md text-body-md w-full rounded-full border-none py-2.5 pr-4 pl-12 transition-all outline-none focus:ring-2"
                placeholder="Search for courses, documents, or keywords..."
                type="text"
              />
            </form>

            <div className="flex items-center gap-4">
              {/* <button className="text-secondary hover:text-primary relative cursor-pointer p-2 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="bg-error absolute top-2 right-2 h-2 w-2 rounded-full"></span>
              </button> */}

              <div className="relative">
                <button
                  onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                  className="border-outline-variant hover:border-primary focus:ring-primary flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border transition-colors focus:ring-2 focus:ring-offset-2"
                >
                  <img
                    alt="User profile avatar"
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYqSMGF3Z3oHdYhn5TKuHMKRLqgbBxxxtoRNxnakx4QY5gEAylvvaC7DqnO-6wRdWbBIdm8lN9SEhMxCbp8hakT47O6vbJLl91-97D8pkJXLj50c3nW8qB-8avFTT50YGPsF-9s6SN75_vCxKk31GsSz7WxQH4X-qlX6XGkFSqpq9alyYCX-ZxYLwHMCljNf0kwH5AertyqfjrTSYFBaxqzh-1604Hz7HFbNugFP3ndIVAs_2OpIbQSJgwvDs5Kcf11UWU6_PEEOQ"
                  />
                </button>

                {showAvatarDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowAvatarDropdown(false)}
                    />
                    <div className="bg-surface-container-lowest border-outline-variant absolute right-0 z-40 mt-2 w-48 rounded-xl border py-2 shadow-lg">
                      <div className="border-outline-variant border-b px-4 py-2">
                        <p className="font-body-md text-on-surface truncate font-semibold">
                          {userFullName}
                        </p>
                      </div>
                      <button
                        className="hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors"
                        onClick={() => {
                          setShowAvatarDropdown(false);
                          setShowVerificationModal(true);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>{' '}
                        Xác thực Giảng viên
                      </button>
                      <hr className="border-outline-variant my-1" />
                      <button
                        onClick={handleLogout}
                        className="hover:bg-error-container/10 text-error font-label-md text-label-md flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <TeacherVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
        />

        {/* Page Content */}
        <main className="flex-1 bg-[#F8F9FA]">{children}</main>
      </div>
    </div>
  );
}
