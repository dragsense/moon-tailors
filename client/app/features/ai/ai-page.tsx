import { useEffect, useState } from "react";
import type {
  IAiProcessor,
  IAiProcessorCurrent,
} from "@template/contracts";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Page } from "~/layouts";
import { useI18n } from "~/hooks/use-i18n";
import { aiProcessorsService, aiService } from "./api";

export function AiPage() {
  const { t } = useI18n();
  const [current, setCurrent] = useState<IAiProcessorCurrent | null>(null);
  const [processors, setProcessors] = useState<IAiProcessor[]>([]);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [cur, list] = await Promise.all([
          aiService.current(),
          aiProcessorsService
            .list({ page: 1, limit: 100 })
            .catch(() => ({ data: [] as IAiProcessor[] })),
        ]);
        setCurrent(cur);
        setProcessors(list.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("ai.loadFailed"));
      }
    })();
  }, [t]);

  const run = async () => {
    if (!prompt.trim()) return;
    setPending(true);
    setError(null);
    setReply(null);
    try {
      const res = await aiService.complete({ prompt: prompt.trim() });
      setReply(res.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ai.completeFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Page title={t("ai.title")} description={t("ai.description")}>
      {error ? (
        <Alert title={t("ai.title")} tone="danger">
          {error}
        </Alert>
      ) : null}

      <section className="space-y-2 rounded-lg border p-4">
        <h3 className="text-sm font-medium">{t("ai.current")}</h3>
        {current ? (
          <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="inline font-medium text-foreground">
                {t("ai.processor")}:{" "}
              </dt>
              <dd className="inline">
                {current.processor.name} ({current.processor.type})
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                {t("ai.source")}:{" "}
              </dt>
              <dd className="inline">{current.source}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                {t("ai.model")}:{" "}
              </dt>
              <dd className="inline">{current.config.model ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                {t("ai.apiKey")}:{" "}
              </dt>
              <dd className="inline">
                {current.config.hasApiKey
                  ? t("ai.apiKeySet")
                  : t("ai.apiKeyMissing")}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("common.actions.loading")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t("ai.envHint")}</p>
      </section>

      {processors.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">{t("ai.catalog")}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {processors.map((p) => (
              <li
                key={p.id}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className="ms-2 text-muted-foreground">{p.type}</span>
                {!p.enabled ? (
                  <span className="ms-2 text-xs text-muted-foreground">
                    ({t("ai.disabled")})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">{t("ai.tryTitle")}</h3>
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">{t("ai.prompt")}</Label>
          <Textarea
            id="ai-prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("ai.promptPlaceholder")}
          />
        </div>
        <Button
          type="button"
          onClick={() => void run()}
          disabled={pending || !prompt.trim()}
        >
          {pending ? t("common.actions.loading") : t("ai.run")}
        </Button>
        {reply ? (
          <div className="space-y-2">
            <Label>{t("ai.reply")}</Label>
            <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {reply}
            </pre>
          </div>
        ) : null}
      </section>
    </Page>
  );
}
