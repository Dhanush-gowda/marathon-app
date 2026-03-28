"use client";

import { useEffect } from "react";

function playZoomSound() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(220, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(680, context.currentTime + 0.28);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(880, context.currentTime);
  filter.frequency.exponentialRampToValueAtTime(1800, context.currentTime + 0.3);

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.42);

  oscillator.onended = () => {
    context.close().catch(() => null);
  };
}

export function AmbientEffects() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const playedKey = "turahalli-zoom-sound-played";

    const trigger = () => {
      if (window.sessionStorage.getItem(playedKey)) {
        return;
      }

      window.sessionStorage.setItem(playedKey, "1");
      playZoomSound();
      window.removeEventListener("pointerdown", trigger);
      window.removeEventListener("keydown", trigger);
    };

    const timer = window.setTimeout(trigger, 250);
    window.addEventListener("pointerdown", trigger, { once: true });
    window.addEventListener("keydown", trigger, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", trigger);
      window.removeEventListener("keydown", trigger);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.12),_transparent_25%)]" />
      <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <svg
        viewBox="0 0 420 860"
        className="runner-float absolute right-[-4rem] top-10 h-[85vh] w-[22rem] opacity-[0.16] sm:right-0 sm:w-[26rem]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M237 74c23 0 41 18 41 41s-18 41-41 41-41-18-41-41 18-41 41-41Z" fill="url(#runnerHead)" />
        <path d="M194 196c18-24 64-37 101-18 21 11 33 32 37 55l13 72c3 17-10 33-28 33h-26l13 91 78 78c11 11 11 29 0 40-11 11-29 11-40 0l-83-83c-6-6-10-14-11-23l-12-78-32 33 11 77 54 120c6 14 0 30-14 36-14 6-30 0-36-14l-58-127c-3-6-4-12-5-19l-12-85c-2-14 3-28 13-37l54-55-10-38-44 28-63 83c-9 12-27 14-39 5-12-9-14-27-5-39l67-88c3-4 7-8 11-10l69-43Z" fill="url(#runnerBody)" />
        <path d="M112 421 62 487" stroke="url(#runnerStroke)" strokeWidth="22" strokeLinecap="round" />
        <path d="M302 331 360 405" stroke="url(#runnerStroke)" strokeWidth="22" strokeLinecap="round" />
        <defs>
          <linearGradient id="runnerHead" x1="196" y1="74" x2="290" y2="156" gradientUnits="userSpaceOnUse">
            <stop stopColor="#67E8F9" />
            <stop offset="1" stopColor="#A7F3D0" />
          </linearGradient>
          <linearGradient id="runnerBody" x1="107" y1="164" x2="391" y2="673" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="runnerStroke" x1="62" y1="331" x2="360" y2="487" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93C5FD" />
            <stop offset="1" stopColor="#6EE7B7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}