import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { PUBLIC_ROUTES } from "~/config";

type CredentialModalProps = {
 open: boolean;
 email: string;
 password: string;
 onClose: () => void;
};

/** One-time share sheet after admin creates a user (credential share sheet). */
export function CredentialModal({
 open,
 email,
 password,
 onClose,
}: CredentialModalProps) {
 const { t } = useI18n();
 const [copied, setCopied] = useState(false);
 const loginUrl =
 typeof window !== "undefined"
 ? `${window.location.origin}${PUBLIC_ROUTES.LOGIN}`
 : PUBLIC_ROUTES.LOGIN;

 const credentialsText = useMemo(
  () =>
 [
 t("users.credentials.heading"),
 "",
 `${t("users.credentials.email")}: ${email}`,
 `${t("users.credentials.password")}: ${password}`,
 "",
 `${t("users.credentials.loginUrl")}: ${loginUrl}`,
 ].join("\n"),
 [email, password, loginUrl, t],
);

 if (!open) return null;

 const copyAll = async () => {
 try {
 await navigator.clipboard.writeText(credentialsText);
 setCopied(true);
 window.setTimeout( () => setCopied(false), 2000);
 } catch {
 // ignore clipboard failures
 }
 };

 return (
 <Modal
 title={t("users.credentials.title")}
 description={t("users.credentials.description")}
 onClose={onClose}
 closeOnOverlay={false}
 >
 <div className="space-y-4">
 <div className="relative space-y-3 rounded-md border bg-muted/40 p-4">
 <div className="absolute end-2 top-2">
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 onClick={ () => void copyAll}
 aria-label={t("users.credentials.copy")}
 >
 {copied ? (
 <Check className="h-4 w-4" />
) : (
 <Copy className="h-4 w-4" />
)}
 </Button>
 </div>

 <div>
 <h4 className="mb-1 text-sm font-medium">
 {t("users.credentials.heading")}
 </h4>
 <p className="text-xs text-muted-foreground">
 {t("users.credentials.shareHint")}
 </p>
 </div>

 <div className="space-y-2">
 <div>
 <p className="text-xs text-muted-foreground">
 {t("users.credentials.email")}
 </p>
 <div className="rounded-md border bg-background px-2 py-1.5 font-mono text-sm">
 {email}
 </div>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">
 {t("users.credentials.password")}
 </p>
 <div className="rounded-md border bg-background px-2 py-1.5 font-mono text-sm">
 {password}
 </div>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">
 {t("users.credentials.loginUrl")}
 </p>
 <div className="rounded-md border bg-background px-2 py-1.5 font-mono text-sm break-all">
 {loginUrl}
 </div>
 </div>
 </div>
 </div>

 <div className="flex justify-between gap-2">
 <Button type="button" variant="outline" onClick={onClose}>
 {t("common.actions.close")}
 </Button>
 <Button
 type="button"
 onClick={ () => {
 const url = `https://wa.me/?text=${encodeURIComponent(credentialsText)}`;
 window.open(url, "_blank", "noopener,noreferrer");
 }}
 >
 {t("users.credentials.shareWhatsApp")}
 </Button>
 </div>
 </div>
 </Modal>
);
}
