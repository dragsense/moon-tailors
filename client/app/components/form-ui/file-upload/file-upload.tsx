import {
  useCallback,
  useEffect,
  useId,
  useState,
  useTransition,
  type DragEvent,
  type ChangeEvent,
} from "react";
import {
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  File as FileIcon,
  Upload,
  X,
} from "lucide-react";
import type { IFileUpload } from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type FileUploadValue = File | IFileUpload | null;

export type FileUploadProps = {
  value: FileUploadValue;
  onChange?: (file: File | null) => void;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  variant?: "card" | "rectangle" | "circle";
  className?: string;
};

function isUploadedFile(value: FileUploadValue): value is IFileUpload {
  return (
    !!value &&
    typeof value === "object" &&
    !(value instanceof File) &&
    "url" in value
  );
}

function FileTypeIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) {
    return <FileImage className="size-8 text-sky-600" />;
  }
  if (type.startsWith("video/")) {
    return <FileVideo className="size-8 text-violet-600" />;
  }
  if (type.startsWith("audio/")) {
    return <FileAudio className="size-8 text-emerald-600" />;
  }
  if (type.includes("pdf") || type.includes("document")) {
    return <FileText className="size-8 text-rose-600" />;
  }
  return <FileIcon className="size-8 text-muted-foreground" />;
}

/**
 * Single-file dropzone — used by the file manager upload form and other
 * schema fields that need a browser File (multipart), not just a URL.
 */
export function FileUpload({
  value,
  onChange,
  maxSizeInMB = 50,
  acceptedTypes,
  disabled,
  variant = "card",
  className,
}: FileUploadProps) {
  const inputId = useId();
  const [, startTransition] = useTransition();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (value instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview({
          url: String(e.target?.result ?? ""),
          type: value.type,
          name: value.name,
        });
      };
      reader.readAsDataURL(value);
      return;
    }
    if (isUploadedFile(value)) {
      setPreview({
        url: value.url,
        type: value.mimeType || "application/octet-stream",
        name: value.name,
      });
      return;
    }
    setPreview(null);
  }, [value]);

  const validateFile = (file: File): boolean => {
    if (acceptedTypes?.length) {
      const name = file.name.toLowerCase();
      const hasExtensions = acceptedTypes.some((t) => t.startsWith("."));
      if (hasExtensions) {
        if (
          !acceptedTypes.some(
            (t) => t.startsWith(".") && name.endsWith(t.toLowerCase()),
          )
        ) {
          setError(
            `Please upload: ${acceptedTypes.filter((t) => t.startsWith(".")).join(", ")}`,
          );
          return false;
        }
      } else if (!acceptedTypes.includes(file.type)) {
        setError(`Please upload: ${acceptedTypes.join(", ")}`);
        return false;
      }
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeInMB}MB`);
      return false;
    }

    setError(null);
    return true;
  };

  const applyFile = (file: File) => {
    if (!validateFile(file)) return;
    startTransition(() => onChange?.(file));
  };

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const next = e.dataTransfer.files?.[0];
      if (next) applyFile(next);
    },
    [disabled],
  );

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (next) applyFile(next);
    e.target.value = "";
  };

  const clear = () => {
    startTransition(() => {
      setPreview(null);
      setError(null);
      onChange?.(null);
    });
  };

  if (preview) {
    const isImage = preview.type.startsWith("image/");
    if (isImage && variant === "circle") {
      return (
        <div className={cn("relative size-32", className)}>
          <img
            src={preview.url}
            alt={preview.name}
            className="size-full rounded-full border object-cover"
          />
          {!disabled ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-0 top-0 size-7 rounded-full bg-background/90 shadow-sm"
              onClick={clear}
            >
              <X className="size-3.5 text-destructive" />
            </Button>
          ) : null}
        </div>
      );
    }

    if (isImage) {
      return (
        <div className={cn("relative w-full max-w-md", className)}>
          <img
            src={preview.url}
            alt={preview.name}
            className="h-48 w-full rounded-lg border object-cover"
          />
          {!disabled ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-2 top-2 size-8 rounded-full bg-background/90 shadow-sm"
              onClick={clear}
            >
              <X className="size-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-muted/30 p-3",
          className,
        )}
      >
        <FileTypeIcon type={preview.type} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{preview.name}</p>
          <p className="truncate text-xs text-muted-foreground">{preview.type}</p>
        </div>
        {!disabled ? (
          <Button type="button" variant="ghost" size="icon" onClick={clear}>
            <X className="size-4 text-destructive" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-50",
          variant === "rectangle" && "min-h-28",
          variant === "circle" && "aspect-square max-w-40 rounded-full",
        )}
      >
        <Upload className="size-8 text-muted-foreground" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Drop a file here or click to browse</p>
          <p className="text-xs text-muted-foreground">
            Max {maxSizeInMB}MB
            {acceptedTypes?.length
              ? ` · ${acceptedTypes.join(", ")}`
              : null}
          </p>
        </div>
        <input
          id={inputId}
          type="file"
          className="sr-only"
          disabled={disabled}
          accept={acceptedTypes?.join(",")}
          onChange={onSelect}
        />
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
