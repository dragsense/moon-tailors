import { useEffect, useState } from "react";
import {
  EEmailDirection,
  type IEmailMessage,
  type IEmailStatus,
  type IEmailThread,
} from "@template/contracts";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Page } from "~/layouts";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { emailService } from "./api";

/** Simple SMTP/IMAP email inbox: threads + compose. */
export function EmailInboxPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<IEmailStatus | null>(null);
  const [threads, setThreads] = useState<IEmailThread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<IEmailMessage[]>([]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadThreads = async () => {
    setError(null);
    try {
      const [statusRes, threadRes] = await Promise.all([
        emailService.status(),
        emailService.threads(),
      ]);
      setStatus(statusRes);
      setThreads(threadRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("email.loadFailed"));
    }
  };

  const loadMessages = async (contactEmail: string) => {
    try {
      const res = await emailService.messages({
        contactEmail,
        page: 1,
        limit: 100,
      });
      const ordered = [...res.data].reverse();
      setMessages(ordered);
      const unread = ordered.filter(
        (m) => m.direction === EEmailDirection.INBOUND && !m.isRead,
      );
      await Promise.all(
        unread.map((m) => emailService.markRead(m.id, true).catch(() => null)),
      );
      if (unread.length) void loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("email.loadFailed"));
    }
  };

  useEffect(() => {
    void loadThreads();
  }, []);

  useEffect(() => {
    if (selected) void loadMessages(selected);
    else setMessages([]);
  }, [selected]);

  const selectThread = (email: string) => {
    setSelected(email);
    setTo(email);
  };

  const onSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await emailService.sync();
      await loadThreads();
      if (selected) await loadMessages(selected);
      if (result.imported === 0) {
        // still fine — nothing new
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("email.syncFailed"));
    } finally {
      setSyncing(false);
    }
  };

  const onSend = async () => {
    const address = to.trim();
    const subj = subject.trim();
    const text = body.trim();
    if (!address || !subj || !text) return;
    setSending(true);
    setError(null);
    try {
      await emailService.send({ to: address, subject: subj, body: text });
      setBody("");
      setSubject("");
      setSelected(address);
      await loadThreads();
      await loadMessages(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("email.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Page
      title={t("email.title")}
      description={t("email.description")}
      actions={
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={syncing}
            onClick={() => void onSync()}
          >
            {syncing ? t("common.actions.loading") : t("email.sync")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadThreads()}
          >
            {t("common.actions.refresh")}
          </Button>
        </div>
      }
    >
      {error ? (
        <Alert title={t("email.title")} tone="danger">
          {error}
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {status
          ? [
              status.sendConfigured
                ? t("email.sendReady", { from: status.fromEmail ?? "—" })
                : t("email.sendOff"),
              status.receiveConfigured
                ? t("email.receiveReady")
                : t("email.receiveOff"),
            ].join(" · ")
          : t("common.actions.loading")}
      </p>

      <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="flex flex-col gap-1 overflow-y-auto border-e pe-3">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("email.threads")}
          </h3>
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("email.noThreads")}</p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.contactEmail}
                type="button"
                onClick={() => selectThread(thread.contactEmail)}
                className={cn(
                  "rounded-md px-2 py-2 text-start text-sm transition-colors hover:bg-muted",
                  selected === thread.contactEmail && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{thread.contactEmail}</span>
                  {thread.unreadCount > 0 ? (
                    <span className="text-xs text-primary">
                      {thread.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs font-medium">
                  {thread.lastSubject}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {thread.lastPreview}
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-md border p-3">
            {selected ? (
              messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("email.noMessages")}
                </p>
              ) : (
                messages.map((msg) => (
                  <article
                    key={msg.id}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      msg.direction === EEmailDirection.OUTBOUND
                        ? "ms-8 border-primary/30 bg-primary/5"
                        : "me-8 bg-muted/50",
                    )}
                  >
                    <header className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {msg.direction === EEmailDirection.OUTBOUND
                          ? t("email.toLabel", { email: msg.toEmail })
                          : t("email.fromLabel", {
                              email: msg.fromName
                                ? `${msg.fromName} <${msg.fromEmail}>`
                                : msg.fromEmail,
                            })}
                      </span>
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    </header>
                    <h4 className="mb-1 font-medium">{msg.subject}</h4>
                    {msg.text ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: msg.html }}
                      />
                    )}
                  </article>
                ))
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("email.selectOrCompose")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t pt-3">
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={t("email.toPlaceholder")}
              autoComplete="email"
            />
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("email.subjectPlaceholder")}
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("email.bodyPlaceholder")}
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={
                  sending || !to.trim() || !subject.trim() || !body.trim()
                }
                onClick={() => void onSend()}
              >
                {sending ? t("common.actions.loading") : t("email.send")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}
