import { useCallback, useEffect, useState } from "react";
import { createApiKeySchema, type IApiKey } from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { useOp } from "~/ops";
import {
  formatDateTimeWithSettings,
  settingsOps,
} from "~/features/settings";
import { Page } from "~/layouts";
import { useAuthOptions } from "~/features/auth/hooks";
import { apiKeysService } from "./api";

export function ApiKeysPage() {
  const { t, intlLocale } = useI18n();
  const mySettings = useOp(settingsOps, "mySettings");
  const prefsData = mySettings.kind === "query" ? mySettings.data : undefined;
  const { data: options } = useAuthOptions();
  const enabled = options?.apiKeyEnabled ?? true;
  const [items, setItems] = useState<IApiKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await apiKeysService.list({ page: 1, limit: 100 });
      setItems(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    }
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  if (!enabled) {
    return (
      <Page title="API keys" description="Machine credentials for the API.">
        <Alert title="Disabled" tone="warning">
          API key auth is turned off on the server (`AUTH_API_KEY_ENABLED=false`).
        </Alert>
      </Page>
    );
  }

  return (
    <Page
      title="API keys"
      description="Issue keys for scripts and integrations. Use Bearer or X-Api-Key — not a session JWT."
    >
      {error ? (
        <Alert title="API keys" tone="danger">
          {error}
        </Alert>
      ) : null}

      {createdKey ? (
        <Alert title="Copy your key now" tone="warning">
          <p className="mb-2 break-all font-mono text-sm">{createdKey}</p>
          <p className="text-sm">
            This secret is shown once. Store it securely, then dismiss.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setCreatedKey(null)}
          >
            Dismiss
          </Button>
        </Alert>
      ) : null}

      <section className="max-w-md space-y-3">
        <h3 className="text-sm font-medium">Create key</h3>
        <SchemaForm
          schema={createApiKeySchema}
          fieldConfig={{ scopes: { hidden: true } }}
          submitLabel={pending ? "Creating…" : "Create API key"}
          onSubmit={async (values) => {
            setPending(true);
            setError(null);
            try {
              const res = await apiKeysService.create({
                name: values.name,
                expiresInDays: values.expiresInDays,
              });
              setCreatedKey(res.key);
              await reload();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to create key",
              );
            } finally {
              setPending(false);
            }
          }}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">Your keys</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active keys.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((key) => (
              <li
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {key.keyPrefix}…
                  </p>
                  {key.expiresAt ? (
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.expires", {
                        date: formatDateTimeWithSettings(
                          key.expiresAt,
                          prefsData,
                          intlLocale,
                        ),
                      })}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void apiKeysService.revoke(key.id).then(reload);
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
