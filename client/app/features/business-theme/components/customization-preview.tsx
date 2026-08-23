import { useEffect, useRef, useState } from "react";
import { Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "~/components/ui/button";
import { withAppBasename } from "~/lib/app-base";
import { cn } from "~/lib/utils";
import {
  BUSINESS_THEME_DRAFT_MESSAGE,
  type BusinessThemeDraftPayload,
  withPreviewQuery,
} from "../lib/preview";

const WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
} as const;

type Device = keyof typeof WIDTHS;

type CustomizationPreviewProps = {
  draft: BusinessThemeDraftPayload;
  path?: string;
  className?: string;
};

export function CustomizationPreview({
  draft,
  path = "/dashboard",
  className,
}: CustomizationPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const src = withAppBasename(withPreviewQuery(path));

  const postDraft = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      { type: BUSINESS_THEME_DRAFT_MESSAGE, payload: draft },
      window.location.origin,
    );
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (
        event.data &&
        typeof event.data === "object" &&
        (event.data as { type?: string }).type ===
          "business-theme-preview-ready"
      ) {
        setReady(true);
        setLoading(false);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(postDraft, 80);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- post latest draft blob
  }, [draft, ready]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={device === "desktop" ? "default" : "outline"}
          onClick={() => setDevice("desktop")}
        >
          <Monitor className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={device === "tablet" ? "default" : "outline"}
          onClick={() => setDevice("tablet")}
        >
          <Tablet className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={device === "mobile" ? "default" : "outline"}
          onClick={() => setDevice("mobile")}
        >
          <Smartphone className="size-4" />
        </Button>
        {loading ? (
          <Loader2 className="ms-auto size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-muted/40">
        <iframe
          ref={iframeRef}
          title="Customization preview"
          src={src}
          className="mx-auto h-full min-h-[28rem] border-0 bg-background transition-[width] duration-200"
          style={{ width: WIDTHS[device], maxWidth: "100%" }}
          onLoad={() => {
            setLoading(false);
            setReady(true);
            postDraft();
          }}
        />
      </div>
    </div>
  );
}
