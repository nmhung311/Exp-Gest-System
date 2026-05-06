export default function BackgroundOverlay() {
  return (
    <div
      aria-hidden
      className="
        fixed inset-0 -z-20 pointer-events-none
        bg-[radial-gradient(60vw_60vw_at_50%_50%,rgba(30,136,229,.03),transparent_70%)]
        bg-no-repeat
      "
    />
  );
}
