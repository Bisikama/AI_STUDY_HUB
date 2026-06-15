"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Micro-interactions for technical feel
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mouse-x", `${x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${y}%`);
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Initialize reveal animations on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".bento-cell, h2").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
    };
  }, []);

  const handleStartBuilding = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const gridBackground = {
    backgroundColor: "#131313",
    backgroundImage: `
      linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
  };

  return (
    <div className="landing-page-root w-full" style={gridBackground}>
      <style dangerouslySetInnerHTML={{
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
      `
      }} />

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-4 bg-[#131313]/80 backdrop-blur-xl border-b-2 border-white">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-extrabold tracking-tighter text-white">MINDFORGE</span>
          <div className="hidden md:flex gap-6">
            <a className="font-label-mono text-label-mono text-white border-b-2 border-white pb-1" href="#" onClick={handleStartBuilding}>Workspace</a>
            <a className="font-label-mono text-label-mono text-on-surface-variant hover:text-white transition-colors" href="#" onClick={handleStartBuilding}>Research</a>
            <a className="font-label-mono text-label-mono text-on-surface-variant hover:text-white transition-colors" href="#" onClick={handleStartBuilding}>Documentation</a>
          </div>
        </div>
        <button onClick={handleStartBuilding} className="px-6 py-2 border-2 border-white font-label-mono text-label-mono hover:bg-white hover:text-[#131313] transition-all duration-200 active:translate-y-0.5 relative corner-notch cursor-pointer">
          Start Building
        </button>
      </nav>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center px-6 md:px-12 relative">
          <div className="grid grid-cols-12 gap-6 w-full z-10">
            <div className="col-span-12 lg:col-span-6 flex flex-col justify-center gap-8">
              <div className="overflow-hidden">
                <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg uppercase leading-none reveal-up">
                  Forge Ideas Into <br /> <span className="text-[#131313] bg-white px-2">Knowledge.</span>
                </h1>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl reveal-up" style={{ animationDelay: "0.2s" }}>
                Transform notes, lectures, PDFs and research materials into intelligent learning systems powered by architectural-grade AI.
              </p>
              <div className="flex gap-4 reveal-up" style={{ animationDelay: "0.4s" }}>
                <button onClick={handleStartBuilding} className="px-8 py-4 bg-white text-[#131313] border-2 border-white font-label-mono text-label-mono hover:bg-transparent hover:text-white transition-all duration-300 cursor-pointer">
                  START BUILDING
                </button>
                <button onClick={handleStartBuilding} className="px-8 py-4 border-2 border-white font-label-mono text-label-mono hover:bg-white hover:text-[#131313] transition-all duration-300 cursor-pointer">
                  EXPLORE WORKSPACE
                </button>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 relative flex justify-center items-center">
              {/* Background Grid Effect */}
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="blueprint-line w-full h-[1px] top-1/4"></div>
                <div className="blueprint-line w-full h-[1px] top-2/4"></div>
                <div className="blueprint-line w-full h-[1px] top-3/4"></div>
                <div className="blueprint-line w-[1px] h-full left-1/4"></div>
                <div className="blueprint-line w-[1px] h-full left-2/4"></div>
                <div className="blueprint-line w-[1px] h-full left-3/4"></div>
              </div>
              {/* 3D Geometric Representation */}
              <div className="relative w-full aspect-square max-w-lg floating-structure">
                <img
                  alt="3D wireframe geometric structure"
                  className="w-full h-full object-contain grayscale invert opacity-90"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAV2tQHGMVyuhrl75clMi0NWaS2Ws5R0J1pkmDDvUbznE4DskKWrKDQz8vQx0lXkDia6TawwXwBqL41eW9RRprWn-vE5DboNyHjIfRBAcM03dUyxsZveTX2c3tWQN0sj9Y1Xv3C3ZL5MgiVRIMmBiLPyh_MUb7XwDgh7qyCKtRVPrcglNqsECjVkAQ-gxF-Z9lC4z8Py3kxcRiGaY-pK9oY8_lvQcxTef8pz4SWGRvX5JfuZda1Jgi4QZP2YyoRW8rDgfKn_7RDCrw"
                />
                {/* Technical Overlays */}
                <div className="absolute top-0 left-0 technical-cross"></div>
                <div className="absolute bottom-0 right-0 technical-cross rotate-180"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Feature Section */}
        <section className="px-6 md:px-12 py-24 border-t-2 border-white">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <span className="font-label-mono text-label-mono text-white bg-surface-container-high px-2 py-1 mb-4 inline-block">SEC_01_FEATURES</span>
              <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl uppercase">Modular Architecture</h2>
            </div>
            <div className="text-right hidden md:block">
              <p className="font-label-mono text-label-mono opacity-40">SYSTEMS_LOAD_0.98</p>
              <p className="font-label-mono text-label-mono opacity-40">GRID_ALIGNED: TRUE</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Card 01: Knowledge Vault */}
            <div onClick={handleStartBuilding} className="md:col-span-7 bento-cell p-8 h-[400px] hover-lift group cursor-pointer">
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">REF_K_VAULT</span>
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md mb-2">Knowledge Vault</h3>
                  <p className="text-on-surface-variant max-w-sm">Every document indexed with semantic precision. Search through concepts, not keywords.</p>
                </div>
                <div className="relative h-48 flex items-center justify-center overflow-hidden">
                  <div className="absolute w-64 h-80 bg-surface-container-lowest border border-outline-variant rotate-[-5deg] group-hover:rotate-[-15deg] group-hover:-translate-x-12 transition-all duration-500"></div>
                  <div className="absolute w-64 h-80 bg-surface-container border border-white group-hover:-translate-y-4 transition-all duration-500"></div>
                  <div className="absolute w-64 h-80 bg-surface-container-high border border-outline-variant rotate-[5deg] group-hover:rotate-[15deg] group-hover:translate-x-12 transition-all duration-500"></div>
                  <span className="material-symbols-outlined text-4xl z-10 text-white">folder_open</span>
                </div>
              </div>
            </div>
            {/* Card 02: AI Workshop */}
            <div onClick={handleStartBuilding} className="md:col-span-5 bento-cell p-8 h-[400px] hover-lift group cursor-pointer">
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">REF_AI_WORK</span>
              <div className="h-full flex flex-col">
                <h3 className="font-headline-md text-headline-md mb-2">AI Workshop</h3>
                <p className="text-on-surface-variant mb-8">Collaborative intelligence that drafts outlines and synthesizes cross-domain research.</p>
                <div className="flex-grow bg-surface-container-lowest border-t-2 border-white p-4 font-label-mono text-xs">
                  <div className="mb-2 text-white opacity-60">&gt; INITIALIZING_AGENT...</div>
                  <div className="mb-2 text-white opacity-60">&gt; ANALYZING_PDF_01...</div>
                  <div className="text-white flex gap-2">
                    <span className="animate-pulse">_</span>
                    <span className="group-hover:block hidden">SYNERGY DETECTED: CHAPTER 3 x THESIS 4</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Card 03: Quiz Factory */}
            <div onClick={handleStartBuilding} className="md:col-span-5 bento-cell p-8 h-[400px] hover-lift group cursor-pointer">
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">REF_Q_FACT</span>
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md mb-2">Quiz Factory</h3>
                  <p className="text-on-surface-variant">Automated spaced-repetition cards generated directly from your materials.</p>
                </div>
                <div className="relative flex justify-center items-center h-48">
                  <div className="w-full h-[2px] bg-outline-variant absolute top-1/2"></div>
                  <div className="flex gap-4 z-10">
                    <div className="w-16 h-20 bg-white text-[#131313] flex items-center justify-center font-bold group-hover:translate-x-24 transition-all duration-700">Q</div>
                    <div className="w-16 h-20 bg-transparent border border-white flex items-center justify-center font-bold text-white font-headline-md">A</div>
                    <div className="w-16 h-20 bg-transparent border border-white flex items-center justify-center font-bold text-white opacity-30 font-headline-md">...</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Card 04: Progress Engine */}
            <div onClick={handleStartBuilding} className="md:col-span-7 bento-cell p-8 h-[400px] hover-lift group cursor-pointer">
              <span className="font-label-mono text-label-mono absolute top-4 left-4 opacity-50">REF_PROG_ENG</span>
              <div className="h-full flex flex-col gap-6">
                <div>
                  <h3 className="font-headline-md text-headline-md mb-2">Progress Engine</h3>
                  <p className="text-on-surface-variant max-w-md">Mathematical tracking of your mastery levels across all disciplines.</p>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-4">
                  <div>
                    <p className="font-label-mono text-xs opacity-50 mb-2">MASTERY_RATIO</p>
                    <div className="h-4 w-full bg-surface-container border border-outline-variant">
                      <div className="h-full bg-white w-[78%] transition-all duration-1000 group-hover:w-[92%]"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-label-mono text-xs opacity-50 mb-2">RETENTION_RATE</p>
                    <div className="h-4 w-full bg-surface-container border border-outline-variant">
                      <div className="h-full bg-white w-[65%] transition-all duration-1000 group-hover:w-[85%]"></div>
                    </div>
                  </div>
                  <div className="col-span-2 bg-surface-container-lowest h-32 relative overflow-hidden border border-outline-variant">
                    <div className="absolute inset-0 opacity-20">
                      <img
                        alt="Technical graph and chart"
                        className="w-full h-full object-cover grayscale invert"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_0bPV1V8GOoZaAVpznnV6WJcQ5si-oSb_wzb9MuXBPM4mQe2hvP8vpNgkEVXqFKjjlexNcfT6B1dheVCqgVRAvbz5OFf8liEgwvCYq0jH6RxcRpOkumaql0V9FNgEZGKuaFblTnReR1gn71UhIKhLUqpoY4bJrVRc-718rfAkD8UuIkhZYT6zrulnNA7BrjCi2aJx4ir9hE12op1gDurDz4lB5Apspg53OHuC_QRez-EKkytGeiwPY_36asY8DPXOdLysnvuU6_Lq"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-label-mono text-white font-bold">+14.2% GROWTH DETECTED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className="px-6 md:px-12 py-24 bg-surface-container-lowest border-t-2 border-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl uppercase mb-8 lg:mb-0">Built for <span className="text-[#3a3a3a] outline-text">thinkers</span>, researchers and future innovators.</h2>
            </div>
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl text-white font-black">2.4M</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">Research Projects</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl text-white font-black">15K</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">Learning Sessions</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl text-white font-black">800K</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">Generated Quizzes</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-display-lg text-headline-xl text-white font-black">1.2B</span>
                <span className="font-label-mono text-label-mono uppercase opacity-60">AI Conversations</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative bg-background overflow-hidden border-t-2 border-white">
          {/* Background Wireframe */}
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center scale-150 opacity-10">
            <div className="w-[800px] h-[800px] border-2 border-white rotate-45 flex items-center justify-center">
              <div className="w-[600px] h-[600px] border-2 border-white rotate-[-15deg] flex items-center justify-center">
                <div className="w-[400px] h-[400px] border-2 border-white rotate-[30deg]"></div>
              </div>
            </div>
          </div>
          <div className="relative z-10 py-32 flex flex-col items-center text-center gap-12">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg uppercase max-w-4xl px-4">
              Build Your <br /> <span className="text-white bg-on-surface px-4 text-[#131313]">Second Brain.</span>
            </h2>
            <button onClick={handleStartBuilding} className="px-12 py-6 border-4 border-white bg-white text-[#131313] font-label-mono text-lg uppercase tracking-widest hover:bg-[#131313] hover:text-white transition-all duration-300 relative group overflow-hidden cursor-pointer">
              <span className="relative z-10">Initialize Workspace</span>
              <div className="absolute inset-0 bg-[#131313] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-40 font-label-mono text-xs uppercase text-white">
              <span>Protocol_v.4.0.1</span>
              <span>Lat: 37.7749 | Long: -122.4194</span>
              <span>System_Status: Operational</span>
              <span>Encrypted_TLS_1.3</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 md:px-12 py-12 bg-surface-container-lowest border-t-2 border-white flex flex-col gap-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-4">
            <span className="font-display-lg text-display-lg-mobile font-black text-white uppercase tracking-tighter">MINDFORGE</span>
            <p className="font-label-mono text-label-mono max-w-xs opacity-60">Engineering a higher standard of academic intelligence through structural rigor and technical precision.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16 text-white">
            <div className="flex flex-col gap-4">
              <span className="font-label-mono text-label-mono text-white font-bold">RESOURCES</span>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">Frameworks</a>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">Case Studies</a>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">API Docs</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label-mono text-label-mono text-white font-bold">SYSTEM</span>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">Privacy</a>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">Terms</a>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">Security</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label-mono text-label-mono text-white font-bold">SOCIALS</span>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">X / Twitter</a>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">GitHub</a>
              <a className="font-body-md text-on-surface-variant hover:text-white transition-colors" href="#">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="pt-12 border-t border-outline-variant flex justify-between items-center text-white">
          <p className="font-label-mono text-label-mono opacity-40">© 2024 MINDFORGE. ARCHITECTURAL RIGOR IN ACADEMIA.</p>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-label-mono text-[10px] opacity-40">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
