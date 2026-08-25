import type { ReactNode } from "react";
import { getSiteChrome } from "@/config";
import { cn } from "@/lib/utils";

export type SiteHeaderProps = {
  className?: string;
  children?: ReactNode;
};

export function SiteHeader({ className, children }: SiteHeaderProps) {
  const { brand, homeHref } = getSiteChrome();

  return (
    <header className={cn("site-header", className)}>
      <a className="site-header__brand" href={homeHref} aria-label={brand}>
        <span className="site-header__mark" aria-hidden="true">
          M
        </span>
      </a>
      <div className="site-header__end">{children}</div>
    </header>
  );
}

export const GlobalHeader = SiteHeader;
export type GlobalHeaderProps = SiteHeaderProps;
