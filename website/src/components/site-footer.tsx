import { useSitePrefs } from "./site-prefs-provider";

export function SiteFooter({ name }: { name: string }) {
  const { t } = useSitePrefs();
  const year = String(new Date().getFullYear());
  const copy = t("footer.copyright")
    .replaceAll("{{year}}", year)
    .replaceAll("{{name}}", name);

  return (
    <footer className="site-footer">
      <p>{copy}</p>
    </footer>
  );
}
