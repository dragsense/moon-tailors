import { en } from "@/locales/en";
import { ur } from "@/locales/ur";
import { getSiteChrome } from "@/config";

/**
 * Static HTML (no `client:*`). Copy switches with `html[lang]` via `[data-locale]`.
 */
export function LandingHero() {
  const chrome = getSiteChrome();
  const enTagline =
    chrome.tagline !== en.hero.tagline ? chrome.tagline : en.hero.tagline;
  const enDescription =
    chrome.description !== en.hero.description
      ? chrome.description
      : en.hero.description;

  return (
    <section className="hero" aria-label={en.hero.title}>
      <img
        className="hero__cover"
        src={chrome.coverImage}
        alt=""
        decoding="async"
      />
      <div className="hero__veil" aria-hidden="true" />

      <div className="hero__content">
        <h1 className="hero__title animate-rise">
          <span className="hero__title-main" data-locale="en">
            {en.hero.title}
          </span>
          <span className="hero__title-main" data-locale="ur">
            {ur.hero.title}
          </span>
          <span className="hero__title-sub" data-locale="en">
            {en.hero.subtitle}
          </span>
          <span className="hero__title-sub" data-locale="ur">
            {ur.hero.subtitle}
          </span>
        </h1>
        <p className="hero__headline animate-rise animate-rise--delay-1" data-locale="en">
          {enTagline}
        </p>
        <p className="hero__headline animate-rise animate-rise--delay-1" data-locale="ur">
          {ur.hero.tagline}
        </p>
        <p className="hero__support animate-rise animate-rise--delay-2" data-locale="en">
          {enDescription}
        </p>
        <p className="hero__support animate-rise animate-rise--delay-2" data-locale="ur">
          {ur.hero.description}
        </p>
        <svg
          className="hero__stitch animate-rise animate-rise--delay-3"
          viewBox="0 0 280 12"
          aria-hidden="true"
        >
          <line
            x1="4"
            y1="6"
            x2="276"
            y2="6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeDasharray="3 8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </section>
  );
}
