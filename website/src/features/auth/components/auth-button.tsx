import { Button } from "@/components/ui";
import { getDashboardUrl, getLoginUrl } from "@/config";
import { en } from "@/locales/en";
import { ur } from "@/locales/ur";
import { cn } from "@/lib/utils";
import { useSession } from "../hooks";

function LocaleLabel({
  enText,
  urText,
}: {
  enText: string;
  urText: string;
}) {
  return (
    <>
      <span data-locale="en">{enText}</span>
      <span data-locale="ur">{urText}</span>
    </>
  );
}

/** Header CTA — login when signed out, dashboard when the shop session exists. */
export function AuthButton() {
  const { signedIn, isLoading } = useSession();

  const href = signedIn ? getDashboardUrl() : getLoginUrl();
  const label = isLoading ? (
    <LocaleLabel enText={en.hero.ctaChecking} urText={ur.hero.ctaChecking} />
  ) : signedIn ? (
    <LocaleLabel enText={en.hero.ctaDashboard} urText={ur.hero.ctaDashboard} />
  ) : (
    <LocaleLabel enText={en.hero.ctaLogin} urText={ur.hero.ctaLogin} />
  );

  return (
    <Button
      asChild
      size="sm"
      className={cn(
        "h-[2.15rem] min-w-[5.5rem] px-3.5 text-[0.88rem] font-semibold",
        isLoading && "pointer-events-none opacity-70",
      )}
    >
      <a href={isLoading ? undefined : href} aria-disabled={isLoading}>
        {label}
      </a>
    </Button>
  );
}
