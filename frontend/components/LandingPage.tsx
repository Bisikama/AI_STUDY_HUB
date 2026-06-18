'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Micro-interactions for technical feel
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Initialize reveal animations on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-up');
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll('.bento-cell, h2').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  const handleStartBuilding = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const gridBackground = {
    backgroundColor: '#131313',
    backgroundImage: `
      linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
  };

  return (
    <div className="landing-page-root w-full" style={gridBackground}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .landing-page-root {
          --color-background: #131313;
          --color-surface: #131313;
          --color-surface-dim: #131313;
          --color-surface-bright: #393939;
          --color-surface-container-lowest: #0e0e0e;
          --color-surface-container-low: #1b1b1b;
          --color-surface-container: #1f1f1f;
          --color-surface-container-high: #2a2a2a;
          --color-surface-container-highest: #353535;
          --color-on-surface: #e2e2e2;
          --color-on-surface-variant: #c4c7c8;
          --color-primary: #ffffff;
          --color-on-primary: #2f3131;
          --color-primary-container: #e2e2e2;
          --color-on-primary-container: #636565;
          --color-secondary: #bdc8d3;
          --color-on-secondary: #28313b;
          --color-secondary-container: #3e4852;
          --color-on-secondary-container: #acb6c2;
          --color-outline: #8e9192;
          --color-outline-variant: #444748;
          --color-on-background: #e2e2e2;
          
          color: #e2e2e2;
          font-family: 'Geist', sans-serif;
          min-height: 100%;
        }

        .reveal-up {
          animation: revealUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes revealUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .blueprint-line {
          position: absolute;
          background: rgba(255, 255, 255, 0.2);
          z-index: 0;
        }

        .corner-notch::after {
          content: 'COORD_001';
          position: absolute;
          top: 4px;
          right: 4px;
          font-family: 'JetBrains Mono';
          font-size: 8px;
          color: rgba(255, 255, 255, 0.4);
        }

        .hover-lift {
          transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
        }
        .hover-lift:hover {
          transform: translateY(-6px);
        }

        .bento-cell {
          border: 2px solid white;
          background: #1b1b1b;
          position: relative;
          overflow: hidden;
        }

        .technical-cross::before, .technical-cross::after {
          content: '';
          position: absolute;
          background: #444748;
          width: 20px;
          height: 1px;
        }
        .technical-cross::before { left: -10px; top: 0; }
        .technical-cross::after { left: 0; top: -10px; width: 1px; height: 20px; }

        .floating-structure {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }

        .font-display-lg { font-family: 'Sora', sans-serif; font-weight: 800; }
        .text-display-lg { font-size: 72px; line-height: 1.1; letter-spacing: -0.04em; }

        .font-display-lg-mobile { font-family: 'Sora', sans-serif; font-weight: 800; }
        .text-display-lg-mobile { font-size: 40px; line-height: 1.1; letter-spacing: -0.04em; }

        .font-headline-xl { font-family: 'Sora', sans-serif; font-weight: 700; }
        .text-headline-xl { font-size: 48px; line-height: 1.2; letter-spacing: -0.02em; }

        .font-headline-xl-mobile { font-family: 'Sora', sans-serif; font-weight: 700; }
        .text-headline-xl-mobile { font-size: 32px; line-height: 1.2; letter-spacing: -0.02em; }

        .font-headline-md { font-family: 'Sora', sans-serif; font-weight: 600; }
        .text-headline-md { font-size: 24px; line-height: 1.4; }

        .font-body-lg { font-family: 'Geist', sans-serif; font-weight: 400; }
        .text-body-lg { font-size: 18px; line-height: 1.6; }

        .font-body-md { font-family: 'Geist', sans-serif; font-weight: 400; }
        .text-body-md { font-size: 16px; line-height: 1.6; }

        .font-label-mono { font-family: 'JetBrains Mono', monospace; font-weight: 500; }
        .text-label-mono { font-size: 12px; line-height: 1.2; letter-spacing: 0.1em; }

        .font-caption { font-family: 'Geist', sans-serif; font-weight: 500; }
        .text-caption { font-size: 14px; line-height: 1.4; }
      `,
        }}
      />

      {/* TopNavBar */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b-2 border-white bg-[#131313]/80 px-6 py-4 backdrop-blur-xl md:px-12">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-extrabold tracking-tighter text-white">
            MINDFORGE
          </span>
          <div className="hidden gap-6 md:flex">
            <a
              className="font-label-mono text-label-mono border-b-2 border-white pb-1 text-white"
              href="#"
              onClick={handleStartBuilding}
            >
              Workspace
            </a>
            <a
              className="font-label-mono text-label-mono text-on-surface-variant transition-colors hover:text-white"
              href="#"
              onClick={handleStartBuilding}
            >
              Research
            </a>
            <a
              className="font-label-mono text-label-mono text-on-surface-variant transition-colors hover:text-white"
              href="#"
              onClick={handleStartBuilding}
            >
              Documentation
            </a>
          </div>
        </div>
        <button
          onClick={handleStartBuilding}
          className="font-label-mono text-label-mono corner-notch relative cursor-pointer border-2 border-white px-6 py-2 transition-all duration-200 hover:bg-white hover:text-[#131313] active:translate-y-0.5"
        >
          Start Building
        </button>
      </nav>

      <main className="overflow-x-hidden pt-24">
        {/* Hero Section */}
        <section className="relative flex min-h-screen items-center px-6 md:px-12">
          <div className="z-10 grid w-full grid-cols-12 gap-6">
            <div className="col-span-12 flex flex-col justify-center gap-8 lg:col-span-6">
              <div className="overflow-hidden">
                <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg reveal-up leading-none uppercase">
                  Forge Ideas Into <br />{' '}
                  <span className="bg-white px-2 text-[#131313]">Knowledge.</span>
                </h1>
              </div>
              <p
                className="font-body-lg text-body-lg text-on-surface-variant reveal-up max-w-xl"
                style={{ animationDelay: '0.2s' }}
              >
                Transform notes, lectures, PDFs and research materials into intelligent learning
                systems powered by architectural-grade AI.
              </p>
              <div className="reveal-up flex gap-4" style={{ animationDelay: '0.4s' }}>
                <button
                  onClick={handleStartBuilding}
                  className="font-label-mono text-label-mono cursor-pointer border-2 border-white bg-white px-8 py-4 text-[#131313] transition-all duration-300 hover:bg-transparent hover:text-white"
                >
                  START BUILDING
                </button>
                <button
                  onClick={handleStartBuilding}
                  className="font-label-mono text-label-mono cursor-pointer border-2 border-white px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#131313]"
                >
                  EXPLORE WORKSPACE
                </button>
              </div>
            </div>
            <div className="relative col-span-12 flex items-center justify-center lg:col-span-6">
              {/* Background Grid Effect */}
              <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
                <div className="blueprint-line top-1/4 h-[1px] w-full"></div>
                <div className="blueprint-line top-2/4 h-[1px] w-full"></div>
                <div className="blueprint-line top-3/4 h-[1px] w-full"></div>
                <div className="blueprint-line left-1/4 h-full w-[1px]"></div>
                <div className="blueprint-line left-2/4 h-full w-[1px]"></div>
                <div className="blueprint-line left-3/4 h-full w-[1px]"></div>
              </div>
              {/* 3D Geometric Representation */}
              <div className="floating-structure relative aspect-square w-full max-w-lg">
                <img
                  alt="3D wireframe geometric structure"
                  className="h-full w-full object-contain opacity-90 grayscale invert"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAV2tQHGMVyuhrl75clMi0NWaS2Ws5R0J1pkmDDvUbznE4DskKWrKDQz8vQx0lXkDia6TawwXwBqL41eW9RRprWn-vE5DboNyHjIfRBAcM03dUyxsZveTX2c3tWQN0sj9Y1Xv3C3ZL5MgiVRIMmBiLPyh_MUb7XwDgh7qyCKtRVPrcglNqsECjVkAQ-gxF-Z9lC4z8Py3kxcRiGaY-pK9oY8_lvQcxTef8pz4SWGRvX5JfuZda1Jgi4QZP2YyoRW8rDgfKn_7RDCrw"
                />
                {/* Technical Overlays */}
                <div className="technical-cross absolute top-0 left-0"></div>
                <div className="technical-cross absolute right-0 bottom-0 rotate-180"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Feature Section */}
        <section className="border-t-2 border-white px-6 py-24 md:px-12">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <span className="font-label-mono text-label-mono bg-surface-container-high mb-4 inline-block px-2 py-1 text-white">
                SEC_01_FEATURES
              </span>
              <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl uppercase">
                Modular Architecture
              </h2>
            </div>
            <div className="hidden text-right md:block">
              <p className="font-label-mono text-label-mono opacity-40">SYSTEMS_LOAD_0.98</p>
              <p className="font-label-mono text-label-mono opacity-40">GRID_ALIGNED: TRUE</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Card 01: Knowledge Vault */}
            <div
              onClick={handleStartBuilding}
              className="bento-cell hover-lift group h-[400px] cursor-pointer p-8 md:col-span-7"
            >
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">
                REF_K_VAULT
              </span>
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md mb-2">Knowledge Vault</h3>
                  <p className="text-on-surface-variant max-w-sm">
                    Every document indexed with semantic precision. Search through concepts, not
                    keywords.
                  </p>
                </div>
                <div className="relative flex h-48 items-center justify-center overflow-hidden">
                  <div className="bg-surface-container-lowest border-outline-variant absolute h-80 w-64 rotate-[-5deg] border transition-all duration-500 group-hover:-translate-x-12 group-hover:rotate-[-15deg]"></div>
                  <div className="bg-surface-container absolute h-80 w-64 border border-white transition-all duration-500 group-hover:-translate-y-4"></div>
                  <div className="bg-surface-container-high border-outline-variant absolute h-80 w-64 rotate-[5deg] border transition-all duration-500 group-hover:translate-x-12 group-hover:rotate-[15deg]"></div>
                  <span className="material-symbols-outlined z-10 text-4xl text-white">
                    folder_open
                  </span>
                </div>
              </div>
            </div>
            {/* Card 02: AI Workshop */}
            <div
              onClick={handleStartBuilding}
              className="bento-cell hover-lift group h-[400px] cursor-pointer p-8 md:col-span-5"
            >
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">
                REF_AI_WORK
              </span>
              <div className="flex h-full flex-col">
                <h3 className="font-headline-md text-headline-md mb-2">AI Workshop</h3>
                <p className="text-on-surface-variant mb-8">
                  Collaborative intelligence that drafts outlines and synthesizes cross-domain
                  research.
                </p>
                <div className="bg-surface-container-lowest font-label-mono flex-grow border-t-2 border-white p-4 text-xs">
                  <div className="mb-2 text-white opacity-60">&gt; INITIALIZING_AGENT...</div>
                  <div className="mb-2 text-white opacity-60">&gt; ANALYZING_PDF_01...</div>
                  <div className="flex gap-2 text-white">
                    <span className="animate-pulse">_</span>
                    <span className="hidden group-hover:block">
                      SYNERGY DETECTED: CHAPTER 3 x THESIS 4
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Card 03: Quiz Factory */}
            <div
              onClick={handleStartBuilding}
              className="bento-cell hover-lift group h-[400px] cursor-pointer p-8 md:col-span-5"
            >
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">
                REF_Q_FACT
              </span>
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md mb-2">Quiz Factory</h3>
                  <p className="text-on-surface-variant">
                    Automated spaced-repetition cards generated directly from your materials.
                  </p>
                </div>
                <div className="relative flex h-48 items-center justify-center">
                  <div className="bg-outline-variant absolute top-1/2 h-[2px] w-full"></div>
                  <div className="z-10 flex gap-4">
                    <div className="flex h-20 w-16 items-center justify-center bg-white font-bold text-[#131313] transition-all duration-700 group-hover:translate-x-24">
                      Q
                    </div>
                    <div className="font-headline-md flex h-20 w-16 items-center justify-center border border-white bg-transparent font-bold text-white">
                      A
                    </div>
                    <div className="font-headline-md flex h-20 w-16 items-center justify-center border border-white bg-transparent font-bold text-white opacity-30">
                      ...
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Card 04: Progress Engine */}
            <div
              onClick={handleStartBuilding}
              className="bento-cell hover-lift group h-[400px] cursor-pointer p-8 md:col-span-7"
            >
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">
                REF_PROG_ENG
              </span>
              <div className="flex h-full flex-col gap-6">
                <div>
                  <h3 className="font-headline-md text-headline-md mb-2">Progress Engine</h3>
                  <p className="text-on-surface-variant max-w-md">
                    Mathematical tracking of your mastery levels across all disciplines.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-8">
                  <div>
                    <p className="font-label-mono mb-2 text-xs opacity-50">MASTERY_RATIO</p>
                    <div className="bg-surface-container border-outline-variant h-4 w-full border">
                      <div className="h-full w-[78%] bg-white transition-all duration-1000 group-hover:w-[92%]"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-label-mono mb-2 text-xs opacity-50">RETENTION_RATE</p>
                    <div className="bg-surface-container border-outline-variant h-4 w-full border">
                      <div className="h-full w-[65%] bg-white transition-all duration-1000 group-hover:w-[85%]"></div>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest border-outline-variant relative col-span-2 h-32 overflow-hidden border">
                    <div className="absolute inset-0 opacity-20">
                      <img
                        alt="Technical graph and chart"
                        className="h-full w-full object-cover grayscale invert"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_0bPV1V8GOoZaAVpznnV6WJcQ5si-oSb_wzb9MuXBPM4mQe2hvP8vpNgkEVXqFKjjlexNcfT6B1dheVCqgVRAvbz5OFf8liEgwvCYq0jH6RxcRpOkumaql0V9FNgEZGKuaFblTnReR1gn71UhIKhLUqpoY4bJrVRc-718rfAkD8UuIkhZYT6zrulnNA7BrjCi2aJx4ir9hE12op1gDurDz4lB5Apspg53OHuC_QRez-EKkytGeiwPY_36asY8DPXOdLysnvuU6_Lq"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-label-mono font-bold text-white">
                        +14.2% GROWTH DETECTED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className="bg-surface-container-lowest border-t-2 border-white px-6 py-24 md:px-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl mb-8 uppercase lg:mb-0">
                Built for <span className="outline-text text-[#3a3a3a]">thinkers</span>, researchers
                and future innovators.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:col-span-8">
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl font-black text-white">2.4M</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">
                  Research Projects
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl font-black text-white">15K</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">
                  Learning Sessions
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl font-black text-white">800K</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">
                  Generated Quizzes
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl font-black text-white">1.2B</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">
                  AI Conversations
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-background relative overflow-hidden border-t-2 border-white">
          {/* Background Wireframe */}
          <div className="pointer-events-none absolute inset-0 z-0 flex scale-150 items-center justify-center opacity-10">
            <div className="flex h-[800px] w-[800px] rotate-45 items-center justify-center border-2 border-white">
              <div className="flex h-[600px] w-[600px] rotate-[-15deg] items-center justify-center border-2 border-white">
                <div className="h-[400px] w-[400px] rotate-[30deg] border-2 border-white"></div>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-12 py-32 text-center">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg max-w-4xl px-4 uppercase">
              Build Your <br />{' '}
              <span className="bg-on-surface px-4 text-[#131313] text-white">Second Brain.</span>
            </h2>
            <button
              onClick={handleStartBuilding}
              className="font-label-mono group relative cursor-pointer overflow-hidden border-4 border-white bg-white px-12 py-6 text-lg tracking-widest text-[#131313] uppercase transition-all duration-300 hover:bg-[#131313] hover:text-white"
            >
              <span className="relative z-10">Initialize Workspace</span>
              <div className="absolute inset-0 translate-y-full bg-[#131313] transition-transform duration-300 group-hover:translate-y-0"></div>
            </button>
            <div className="font-label-mono flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs text-white uppercase opacity-40">
              <span>Protocol_v.4.0.1</span>
              <span>Lat: 37.7749 | Long: -122.4194</span>
              <span>System_Status: Operational</span>
              <span>Encrypted_TLS_1.3</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest flex w-full flex-col gap-12 border-t-2 border-white px-6 py-12 md:px-12">
        <div className="flex flex-col items-start justify-between gap-12 md:flex-row">
          <div className="flex flex-col gap-4">
            <span className="font-display-lg text-display-lg-mobile font-black tracking-tighter text-white uppercase">
              MINDFORGE
            </span>
            <p className="font-label-mono text-label-mono max-w-xs opacity-60">
              Engineering a higher standard of academic intelligence through structural rigor and
              technical precision.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-16 text-white md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <span className="font-label-mono text-label-mono font-bold text-white">
                RESOURCES
              </span>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                Frameworks
              </a>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                Case Studies
              </a>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                API Docs
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label-mono text-label-mono font-bold text-white">SYSTEM</span>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                Privacy
              </a>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                Terms
              </a>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                Security
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label-mono text-label-mono font-bold text-white">SOCIALS</span>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                X / Twitter
              </a>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                GitHub
              </a>
              <a
                className="font-body-md text-on-surface-variant transition-colors hover:text-white"
                href="#"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
        <div className="border-outline-variant flex items-center justify-between border-t pt-12 text-white">
          <p className="font-label-mono text-label-mono opacity-40">
            © 2024 MINDFORGE. ARCHITECTURAL RIGOR IN ACADEMIA.
          </p>
          <div className="flex gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
            <span className="font-label-mono text-[10px] opacity-40">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
