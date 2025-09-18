'use client'

export default function BackgroundGlow() {
  return (
    <div
      aria-hidden
      className="
        fixed inset-0 -z-10 pointer-events-none
        bg-[#0B0F14]
      "
    >
      {/* lớp gradient */}
      <div
        className="
          absolute inset-0
          bg-[image:var(--bg-neon)]
          [background-blend-mode:screen]
        "
      />
      {/* lớp vignette rất nhẹ */}
      <div
        className="
          absolute inset-0
          before:content-[''] before:absolute before:inset-0
          before:[background:radial-gradient(120%_80%_at_50%_50%,transparent_60%,rgba(0,0,0,0.25)_100%)]
          before:pointer-events-none
        "
      />
    </div>
  );
}
