'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import axiosClient from '@/utils/axios';
import TeacherVerificationModal from '@/components/TeacherVerificationModal';
import { notificationsApi, SystemNotification } from '@/services/notificationsApi';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [search, setSearch] = useState('');
  const [userFullName, setUserFullName] = useState('User');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; fullName: string; role: 'STUDENT' | 'TEACHER' | 'ADMIN' } | null>(null);

  // Fetch notifications
  const { data: notifications = [], mutate: mutateNotifications } = useSWR(
    '/notifications',
    () => notificationsApi.getNotifications(),
    { refreshInterval: 10000 }
  );

  const unreadCount = notifications.filter((n: SystemNotification) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      mutateNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      mutateNotifications();
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        const userObj = JSON.parse(storedUser);
        setUser(userObj);
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
        className={`${mobileMenuOpen ? 'flex' : 'hidden'
          } border-outline-variant bg-surface-container-lowest fixed top-0 left-0 z-20 h-full w-64 flex-col border-r p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all md:flex`}
      >
        <div className="mt-2 mb-8 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <div>
              <h1 className="font-headline-md text-headline-md text-primary font-bold">
                AI STUDY HUB
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
              className={`font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95 ${pathname === '/dashboard'
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
              className={`font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95 ${pathname.includes('/dashboard/documents')
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
              className={`font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95 ${pathname.includes('/practice')
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
            <a
              className="text-error font-label-md text-label-md flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-transform hover:bg-red-50 hover:text-rose-700 active:scale-95"
              href="#"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined text-error">logout</span> Log out
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
              <span className="font-headline-md text-headline-md text-primary">AI STUDY HUB</span>
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
              {/* Notification Bell & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotificationsDropdown(!showNotificationsDropdown);
                    setShowAvatarDropdown(false);
                  }}
                  className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-outline-variant text-secondary hover:border-primary hover:text-primary transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <span className="material-symbols-outlined text-[24px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowNotificationsDropdown(false)}
                    />
                    <div className="bg-surface-container-lowest border-outline-variant absolute right-0 z-40 mt-2 w-80 rounded-2xl border py-3 px-4 shadow-xl flex flex-col gap-2 max-h-[400px]">
                      <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                        <span className="font-title-md text-[16px] font-bold text-on-surface">Thông báo</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-primary hover:underline text-xs font-semibold"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 divide-y divide-outline-variant/30 overflow-y-auto max-h-[300px] pr-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-secondary text-sm flex flex-col items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[32px] text-secondary/50">notifications_off</span>
                            Không có thông báo nào
                          </div>
                        ) : (
                          notifications.map((n: SystemNotification) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (!n.isRead) handleMarkAsRead(n.id);
                              }}
                              className={`group flex flex-col gap-1 py-2.5 transition-colors cursor-pointer rounded-lg px-2 hover:bg-surface-container-low ${
                                !n.isRead ? 'bg-primary-container/10' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm font-semibold truncate ${
                                  !n.isRead ? 'text-primary' : 'text-on-surface'
                                }`}>
                                  {n.title}
                                </span>
                                {!n.isRead && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                                )}
                              </div>
                              <p className="text-secondary text-xs line-clamp-3 leading-relaxed">
                                {n.content}
                              </p>
                              <span className="text-[10px] text-secondary/60 mt-1">
                                {new Date(n.createdAt).toLocaleDateString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                  className={`border-outline-variant hover:border-primary focus:ring-primary flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border transition-colors focus:ring-2 focus:ring-offset-2 ${
                    user?.role === 'TEACHER'
                      ? 'ring-2 ring-emerald-500 ring-offset-1 border-transparent'
                      : user?.role === 'ADMIN'
                      ? 'ring-2 ring-blue-600 ring-offset-1 border-transparent'
                      : ''
                  }`}
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
                      {user?.role !== 'TEACHER' && user?.role !== 'ADMIN' && (
                        <button
                          className="hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors"
                          onClick={() => {
                            setShowAvatarDropdown(false);
                            setShowVerificationModal(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>{' '}
                          Instructor Verification
                        </button>
                      )}
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
