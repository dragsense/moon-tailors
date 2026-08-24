import { useEffect, useState } from "react";
import { useSitePrefs } from "../../../components/site-prefs-provider";
import { hasShopSession } from "../../../lib/session";
import { HeroGarment } from "./hero-garment";

type LandingHeroProps = {
  brand: string;
  loginUrl: string;
  dashboardUrl: string;
  apiUrl: string;
  taglineOverride?: string;
  descriptionOverride?: string;
};

export function LandingHero({
  brand,
  loginUrl,
  dashboardUrl,
  apiUrl,
  taglineOverride,
  descriptionOverride,
}: LandingHeroProps) {
  const { language, t } = useSitePrefs();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const tagline =
    language === "en" && taglineOverride ? taglineOverride : t("hero.tagline");
  const description =
    language === "en" && descriptionOverride
      ? descriptionOverride
      : t("hero.description");

  useEffect(() => {
    let cancelled = false;
    void hasShopSession(apiUrl).then((ok) => {
      if (!cancelled) setSignedIn(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const ctaHref = signedIn ? dashboardUrl : loginUrl;
  const ctaLabel =
    signedIn === null
      ? t("hero.ctaChecking")
      : signedIn
        ? t("hero.ctaDashboard")
        : t("hero.ctaLogin");

  return (
    <section className="hero" aria-label={t("a11y.intro")}>
      <div className="hero__atmosphere" aria-hidden="true" />
      <div className="hero__cloth" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />

      <div className="hero__content">
        <HeroGarment />
        <h1 className="hero__title animate-rise">
          <span className="hero__title-main">{t("hero.title")}</span>
          <span className="hero__title-sub">{t("hero.subtitle")}</span>
        </h1>
        <svg
          className="hero__stitch animate-rise animate-rise--delay-1"
          viewBox="0 0 280 12"
          aria-hidden="true"
        >
          <line
            x1="8"
            y1="6"
            x2="272"
            y2="6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeDasharray="2 9"
            strokeLinecap="round"
          />
        </svg>
        <p className="hero__headline animate-rise animate-rise--delay-1">
          {tagline}
        </p>
        <p className="hero__support animate-rise animate-rise--delay-2">
          {description}
        </p>
        <div className="hero__cta animate-rise animate-rise--delay-3">
          <a
            className="btn btn--primary"
            href={signedIn === null ? undefined : ctaHref}
            aria-disabled={signedIn === null}
            aria-label={`${ctaLabel} — ${brand}`}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
