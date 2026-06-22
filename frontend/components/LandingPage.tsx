'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setTimeout(() => {
      setIsLoggedIn(!!token);
    }, 0);
  }, []);

  const handleNavigation = (path: string) => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push(path);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Navbar */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-slate-100 bg-[#FCFCFD]/80 backdrop-blur-md transition-all duration-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div
              onClick={() => handleNavigation('/')}
              className="group flex cursor-pointer items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-black">
                ScholarHub
              </span>
            </div>

            {/* Menu Items */}
            <div className="hidden items-center gap-7 md:flex">
              <a
                className="cursor-pointer border-b-2 border-slate-900 pb-1 text-[13px] font-semibold text-slate-900"
                onClick={() => handleNavigation('/')}
              >
                Discover
              </a>
              <a
                className="cursor-pointer text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
                onClick={() => handleNavigation('/login')}
              >
                Features
              </a>
              <a
                className="cursor-pointer text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
                onClick={() => handleNavigation('/login')}
              >
                Pricing
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="cursor-pointer px-3 py-2 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="cursor-pointer rounded-lg bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-black active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="overflow-x-hidden pt-28">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Hero Left */}
            <div className="flex flex-col items-start gap-6 lg:col-span-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Next-Gen Learning
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl leading-[1.15] font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-[44px]">
                Master Your Courses with AI-Powered Study Tools
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-500 md:text-[16px]">
                Upload your lecture notes and textbooks to generate instant summaries, interactive
                quizzes, and chat with an AI tutor that knows your curriculum inside out.
              </p>

              {/* CTA Buttons */}
              <div className="mt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="cursor-pointer rounded-xl bg-[#0F172A] px-7 py-3.5 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-black active:scale-98"
                >
                  Get Started
                </button>
                <button
                  onClick={() => handleNavigation('/login')}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-[14px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-98"
                >
                  Explore Materials
                </button>
              </div>

              {/* Social Proof */}
              <div className="mt-4 flex items-center gap-3">
                {/* Avatars Stack */}
                <div className="flex -space-x-3">
                  <img
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=80"
                    alt="Student 1"
                  />
                  <img
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80"
                    alt="Student 2"
                  />
                  <img
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80"
                    alt="Student 3"
                  />
                </div>
                <span className="text-[12px] font-semibold text-slate-500">
                  Join <strong className="font-bold text-slate-900">12,000+</strong> students today
                </span>
              </div>
            </div>

            {/* Hero Right */}
            <div className="relative flex justify-center lg:col-span-6">
              <div className="group relative aspect-[4/3] w-full max-w-[500px] overflow-hidden rounded-3xl border border-slate-100 bg-[#FAFAFB] shadow-xl shadow-slate-100">
                <img
                  src="/student_ai_study.png"
                  alt="AI Study Assistant 3D Render"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-102"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Header Section */}
        <section className="mx-auto max-w-6xl border-t border-slate-100 px-6 py-16 md:py-24">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Everything you need to excel
            </h2>
            <p className="text-[14px] leading-relaxed text-slate-500">
              Designed for focus, our professional-grade tools help you cut through the noise and
              understand complex concepts faster.
            </p>
          </div>

          {/* Feature Bento Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Card Left: Document Sharing */}
            <div
              onClick={() => handleNavigation('/login')}
              className="group flex h-auto min-h-[350px] cursor-pointer flex-col justify-between rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:border-slate-200 hover:shadow-md md:col-span-7"
            >
              <div className="flex flex-col gap-6">
                {/* Icon Container */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F172A] text-white shadow-sm">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-bold text-slate-900 group-hover:text-black">
                    Document Sharing & Management
                  </h3>
                  <p className="text-[13.5px] leading-relaxed text-slate-500">
                    Securely upload and organize all your academic files. Sync your notes across
                    devices and collaborate with peers in real-time. Supports PDF, DOCX, and
                    high-res images.
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-900 hover:underline">
                  Learn more
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Right Column Stack */}
            <div className="flex flex-col gap-6 md:col-span-5">
              {/* Card Right 1: AI Chatbot */}
              <div
                onClick={() => handleNavigation('/login')}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shadow-inner transition-colors group-hover:bg-slate-200">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-[15px] font-bold text-slate-900">AI Document Chatbot</h4>
                  <p className="text-[12.5px] leading-relaxed text-slate-500">
                    Ask questions directly to your textbooks. Get instant citations and deep
                    explanations.
                  </p>
                </div>
              </div>

              {/* Card Right 2: Interactive Study Aids */}
              <div
                onClick={() => handleNavigation('/login')}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shadow-inner transition-colors group-hover:bg-slate-200">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-[15px] font-bold text-slate-900">
                    Interactive Study Aids
                  </h4>
                  <p className="text-[12.5px] leading-relaxed text-slate-500">
                    Automatically generate flashcards and quizzes based on your specific study
                    materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlight Feature Section */}
        <section className="mx-auto max-w-6xl border-t border-slate-100 px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Mockup UI */}
            <div className="flex justify-center lg:col-span-6">
              <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-100">
                {/* Header Mockup */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    SH
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="h-3 w-28 rounded bg-slate-900"></div>
                    <div className="h-2 w-16 rounded bg-slate-200"></div>
                  </div>
                </div>
                {/* Content mockup with highlighted items */}
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-slate-100"></div>
                  <div className="relative h-3 w-5/6 rounded bg-yellow-100">
                    <span className="absolute inset-0 rounded bg-yellow-200/50"></span>
                  </div>
                  <div className="h-3 w-full rounded bg-slate-100"></div>
                  <div className="h-3 w-4/5 rounded bg-slate-100"></div>
                  <div className="relative h-3 w-11/12 rounded bg-blue-100">
                    <span className="absolute inset-0 rounded bg-blue-200/50"></span>
                  </div>
                </div>
                {/* Actions mockup */}
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="h-6 w-12 rounded bg-slate-100"></div>
                  <div className="h-7 w-20 rounded-lg bg-slate-900"></div>
                </div>
              </div>
            </div>

            {/* Right Explanation */}
            <div className="flex flex-col gap-6 lg:col-span-6">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                Paper-like experience, digital efficiency.
              </h2>

              <div className="space-y-6">
                {/* Bullet 1 */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 text-[15px] font-bold text-slate-900">
                      Distraction-Free Reading
                    </h4>
                    <p className="text-[13px] leading-relaxed text-slate-500">
                      Clean layouts designed to reduce eye strain and maximize information
                      retention.
                    </p>
                  </div>
                </div>

                {/* Bullet 2 */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 text-[15px] font-bold text-slate-900">
                      Smart Highlighting
                    </h4>
                    <p className="text-[13px] leading-relaxed text-slate-500">
                      Export your highlights directly to Notion, Obsidian, or Anki for your second
                      brain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-[#090A0F] px-8 py-16 text-center shadow-xl md:py-20">
            {/* Grid Pattern Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <h2 className="relative z-10 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Ready to elevate your grades?
            </h2>
            <p className="relative z-10 max-w-md text-[14px] leading-relaxed text-slate-400">
              Join thousands of university students who have transformed their study habits with
              ScholarHub.
            </p>
            <button
              onClick={() => handleNavigation('/login')}
              className="relative z-10 mt-2 cursor-pointer rounded-full bg-white px-8 py-3.5 text-[14px] font-semibold text-slate-950 shadow-md transition-all hover:scale-102 hover:bg-slate-100 active:scale-98"
            >
              Create Your Account
            </button>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="mt-20 border-t border-slate-100 bg-white px-6 py-12 md:py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          <div className="flex flex-col justify-between gap-12 md:flex-row">
            {/* Column 1: Info */}
            <div className="flex max-w-sm flex-col gap-4">
              <span className="text-xl font-bold tracking-tight text-slate-900">ScholarHub</span>
              <p className="text-[13px] leading-relaxed text-slate-500">
                Bridging the gap between traditional learning and modern artificial intelligence for
                students worldwide.
              </p>
              {/* Share & Mail Icons */}
              <div className="mt-2 flex gap-3">
                <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:text-slate-900">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
                <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:text-slate-900">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Links Columns */}
            <div className="grid grid-cols-2 gap-12 md:grid-cols-3 md:gap-16">
              {/* Col 2 */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold tracking-wider text-slate-900 uppercase">
                  Platform
                </span>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Documents
                </a>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  AI Assistant
                </a>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Practice Mode
                </a>
              </div>

              {/* Col 3 */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold tracking-wider text-slate-900 uppercase">
                  Resources
                </span>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Help Center
                </a>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Community
                </a>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Blog
                </a>
              </div>

              {/* Col 4 */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold tracking-wider text-slate-900 uppercase">
                  Legal
                </span>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Privacy
                </a>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Terms
                </a>
                <a
                  className="cursor-pointer text-[12.5px] text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => handleNavigation('/login')}
                >
                  Cookies
                </a>
              </div>
            </div>
          </div>

          {/* Copyright Area */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 md:flex-row">
            <p className="text-[12px] text-slate-400">
              © 2024 ScholarHub. All rights reserved. Built for academic excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
