export default function BackgroundGradient() {
  return (
    <div className="absolute inset-0 dark:bg-sidebar !fixed z-0">
      {/* Light mode gradient */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-0"
        style={{
          backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 255, 255, 0.17), rgba(255, 255, 255, 0)), linear-gradient(rgb(254, 247, 255) 15%, rgb(244, 214, 250))`,
        }}
      ></div>
      {/* Dark mode gradient */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-40"
        style={{
          backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 1, 111, 0.19), rgba(255, 1, 111, 0.08)), linear-gradient(rgb(63, 51, 69) 15%, rgb(7, 3, 9))`,
        }}
      ></div>
      <div className="absolute inset-0 bg-noise"></div>
      <div className="absolute inset-0 bg-black/40 dark:block hidden"></div>
    </div>
  );
}
