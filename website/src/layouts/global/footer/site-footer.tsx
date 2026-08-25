import { getSiteConfig } from "@/config";
import { resolveTranslation } from "@/locales";
import { en } from "@/locales/en";
import { ur } from "@/locales/ur";
import { cn } from "@/lib/utils";

export type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  const { name } = getSiteConfig();
  const year = String(new Date().getFullYear());
  const params = { year, name };

  return (
    <footer className={cn("site-footer", className)}>
      <p>
        <span data-locale="en">
          {resolveTranslation(en, "footer.copyright", params)}
        </span>
        <span data-locale="ur">
          {resolveTranslation(ur, "footer.copyright", params)}
        </span>
      </p>
    </footer>
  );
}

export const GlobalFooter = SiteFooter;
export type GlobalFooterProps = SiteFooterProps;
