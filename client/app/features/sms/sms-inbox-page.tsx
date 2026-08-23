import { useEffect, useState } from "react";
import {
  ESmsDirection,
  type ISmsMessage,
  type ISmsStatus,
  type ISmsThread,
} from "@template/contracts";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Page } from "~/layouts";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { smsService } from "./api";

/** Simple Twilio SMS inbox: threads + compose. */
export function SmsInboxPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<ISmsStatus | null>(null);
  const [threads, setThreads] = useState<ISmsThread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ISmsMessage[]>([]);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadThreads = async () => {
    setError(null);
    try {
      const [statusRes, threadRes] = await Promise.all([
        smsService.status(),
        smsService.threads(),
      ]);
      setStatus(statusRes);
      setThreads(threadRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sms.loadFailed"));
    }
  };

  const loadMessages = async (contactPhone: string) => {
    try {
      const res = await smsService.messages({
        contactPhone,
        page: 1,
        limit: 100,
      });
      setMessages([...res.data].reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sms.loadFailed"));
    }
  };

  useEffect(() => {
    void loadThreads();
  }, []);

  useEffect(() => {
    if (selected) void loadMessages(selected);
    else setMessages([]);
  }, [selected]);

  const selectThread = (phone: string) => {
    setSelected(phone);
    setTo(phone);
  };

  const onSend = async () => {
    const phone = to.trim();
    const text = body.trim();
    if (!phone || !text) return;
    setSending(true);
    setError(null);
    try {
      await smsService.send({ to: phone, body: text });
      setBody("");
      setSelected(phone);
      await loadThreads();
      await loadMessages(phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sms.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Page
      title={t("sms.title")}
      description={t("sms.description")}
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadThreads()}
        >
          {t("common.actions.refresh")}
        </Button>
      }
    >
      {error ? (
        <Alert title={t("sms.title")} tone="danger">
          {error}
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {status?.configured
          ? t("sms.configured", { number: status.fromNumber ?? "—" })
          : t("sms.notConfigured")}
      </p>

      <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="flex flex-col gap-1 overflow-y-auto border-e pe-3">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("sms.threads")}
          </h3>
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("sms.noThreads")}</p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.contactPhone}
                type="button"
                onClick={() => selectThread(thread.contactPhone)}
                className={cn(
                  "rounded-md px-2 py-2 text-start text-sm transition-colors hover:bg-muted",
                  selected === thread.contactPhone && "bg-muted",
                )}
              >
                <div className="font-medium">{thread.contactPhone}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {thread.lastBody}
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-md border p-3">
            {selected ? (
              messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("sms.noMessages")}
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[85%] rounded-md px-3 py-2 text-sm",
                      msg.direction === ESmsDirection.OUTBOUND
                        ? "ms-auto bg-primary text-primary-foreground"
                        : "me-auto bg-muted",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px] opacity-70",
                        msg.direction === ESmsDirection.OUTBOUND
                          ? "text-end"
                          : "text-start",
                      )}
                    >
                      {msg.status} · {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("sms.selectOrCompose")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t pt-3">
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={t("sms.toPlaceholder")}
              autoComplete="tel"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("sms.bodyPlaceholder")}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={sending || !to.trim() || !body.trim()}
                onClick={() => void onSend()}
              >
                {sending ? t("common.actions.loading") : t("sms.send")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}
