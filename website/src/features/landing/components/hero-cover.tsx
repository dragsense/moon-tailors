import { getSiteChrome } from "@/config";

const DEFAULT_COVER_WEBP = "/images/hero-cover.webp";
const DEFAULT_COVER_JPG = "/images/hero-cover.jpg";
const DEFAULT_SRCSET =
  "/images/hero-cover-800.webp 800w, /images/hero-cover.webp 1280w";

function isDefaultCover(src: string): boolean {
  return (
    src === DEFAULT_COVER_WEBP ||
    src.endsWith("/images/hero-cover.webp") ||
    src.endsWith("/images/hero-cover.png") ||
    src.endsWith("/images/hero-cover.jpg")
  );
}

export function HeroCover() {
  const { coverImage } = getSiteChrome();

  if (!isDefaultCover(coverImage)) {
    return (
      <img
        className="hero__cover"
        src={coverImage}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
    );
  }

  return (
    <picture>
      <source type="image/webp" srcSet={DEFAULT_SRCSET} sizes="100vw" />
      <img
        className="hero__cover"
        src={DEFAULT_COVER_JPG}
        alt=""
        width={1280}
        height={853}
        decoding="async"
        fetchPriority="high"
      />
    </picture>
  );
}
