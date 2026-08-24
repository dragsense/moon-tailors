import { cn } from "~/lib/utils";

export type AppLoaderProps = {
  /** Brand mark letter (defaults to M). */
  initial?: string;
  /** App / product name under the mark. */
  title?: string;
  /** Status line under the dots. */
  message?: string;
  className?: string;
};

/**
 * Full-viewport branded loader — used by route guards + hydrate fallback.
 * No hooks: safe before I18n/Theme providers mount.
 */
export function AppLoader({
  initial = "M",
  title = "Moon Tailors",
  message = "Loading…",
  className,
}: AppLoaderProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden bg-background",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.51_0.09_180_/_0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.6_0.1_220_/_0.1),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,oklch(0.5_0.02_250_/_0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0.02_250_/_0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <div className="relative flex flex-col items-center gap-7 px-6">
        <div className="relative flex size-20 items-center justify-center">
          <span
            aria-hidden
            className="app-loader-ring absolute inset-0 rounded-[1.35rem] border border-primary/25"
          />
          <span
            aria-hidden
            className="app-loader-orbit absolute inset-[-6px] rounded-[1.6rem] border border-transparent border-t-primary/70 border-r-primary/20"
          />
          <span className="app-loader-mark relative flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-semibold tracking-tight text-primary-foreground shadow-[0_12px_40px_-12px_oklch(0.51_0.09_180_/_0.65)]">
            {initial}
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="app-loader-title text-lg font-semibold tracking-tight text-foreground">
            {title}
          </p>
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="app-loader-dot size-1.5 rounded-full bg-primary" />
            <span className="app-loader-dot app-loader-dot-delay-1 size-1.5 rounded-full bg-primary" />
            <span className="app-loader-dot app-loader-dot-delay-2 size-1.5 rounded-full bg-primary" />
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
