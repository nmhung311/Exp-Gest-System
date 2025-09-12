import React from "react";

// Background-only component: layered gradients + subtle grid + noise.
// Drop this at app root. Anything you render as children will sit above it.
// Tailwind only. No external images.

export default function MeshBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-zinc-950 text-white">
      {/* radial vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,119,198,0.25)_0%,rgba(0,0,0,0)_70%)]" />

      {/* mesh blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[60vh] w-[60vh] rounded-full bg-gradient-to-br from-fuchsia-500/30 via-purple-500/20 to-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[55vh] w-[55vh] rounded-full bg-gradient-to-tr from-emerald-400/25 via-teal-400/20 to-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20vh] left-1/4 h-[70vh] w-[70vh] rounded-full bg-gradient-to-tr from-rose-500/25 via-orange-400/20 to-yellow-300/10 blur-3xl" />

      {/* soft center glow */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]">
        <div className="absolute left-1/2 top-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_90deg,theme(colors.indigo.500_/_25%),theme(colors.sky.500_/_20%),theme(colors.purple.500_/_20%),transparent_70%)] blur-2xl" />
      </div>

      {/* grid overlay */}
      <div className="pointer-events-none absolute inset-0 [background:linear-gradient(transparent,transparent_31px,rgba(255,255,255,0.04)_32px),linear-gradient(90deg,transparent,transparent_31px,rgba(255,255,255,0.04)_32px)] bg-[length:32px_32px] opacity-70" />

      {/* noise film */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml;utf8,\
        <svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'>\
          <filter id=\\'n\\'>\
            <feTurbulence type=\\'fractalNoise\\' baseFrequency=\\'.9\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\'/>\
            <feColorMatrix type=\\'saturate\\' values=\\'0\\'/>\
          </filter>\
          <rect width=\\'100%\\' height=\\'100%\\' filter=\\'url(%23n)\\' opacity=\\'.05\\'/>\
        </svg>')" }} />

      {/* content slot */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
