import { useSitePrefs } from "../../../components/site-prefs-provider";

type LandingHeroProps = {
  brand: string;
  loginUrl: string;
  signupUrl: string;
  /** Optional EN override from PUBLIC_SITE_TAGLINE */
  taglineOverride?: string;
  /** Optional EN override from PUBLIC_SITE_DESCRIPTION */
  descriptionOverride?: string;
};

export function LandingHero({
  brand,
  loginUrl,
  signupUrl,
  taglineOverride,
  descriptionOverride,
}: LandingHeroProps) {
  const { language, t } = useSitePrefs();

  const tagline =
    language === "en" && taglineOverride
      ? taglineOverride
      : t("hero.tagline");
  const description =
    language === "en" && descriptionOverride
      ? descriptionOverride
      : t("hero.description");

  return (
    <section className="hero" aria-label={t("a11y.intro")}>
      <div className="hero__atmosphere" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__brand animate-rise">{brand}</p>
        <h1 className="hero__headline animate-rise animate-rise--delay-1">
          {tagline}
        </h1>
        <p className="hero__support animate-rise animate-rise--delay-2">
          {description}
        </p>
        <div className="hero__cta animate-rise animate-rise--delay-3">
          <a className="btn btn--primary" href={signupUrl}>
            {t("hero.ctaStart")}
          </a>
          <a className="btn btn--ghost" href={loginUrl}>
            {t("hero.ctaLogin")}
          </a>
        </div>
      </div>
    </section>
  );
}
