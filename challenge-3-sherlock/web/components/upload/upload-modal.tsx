/**
 * Modal dialog for uploading blk.dat, rev.dat, and xor.dat files.
 * Supports individual file selection and drag-and-drop. Sends files
 * to POST /api/analyze, shows progress, and reports the new stem on success.
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, X, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/spinner";

type FileSlot = "blk" | "rev" | "xor";

const FILE_SLOTS: { key: FileSlot; label: string; hint: string }[] = [
  { key: "blk", label: "Block Data", hint: "blk*.dat" },
  { key: "rev", label: "Undo / Rev Data", hint: "rev*.dat" },
  { key: "xor", label: "XOR Key", hint: "xor.dat" },
];

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (stem: string) => void;
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<Record<FileSlot, File | null>>({
    blk: null,
    rev: null,
    xor: null,
  });
  const [status, setStatus] = useState<"idle" | "analyzing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRefs = {
    blk: useRef<HTMLInputElement>(null),
    rev: useRef<HTMLInputElement>(null),
    xor: useRef<HTMLInputElement>(null),
  };

  const allSelected = files.blk !== null && files.rev !== null && files.xor !== null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "analyzing") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, status]);

  const assignFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (name.startsWith("blk") && name.endsWith(".dat")) {
      setFiles((prev) => ({ ...prev, blk: file }));
    } else if (name.startsWith("rev") && name.endsWith(".dat")) {
      setFiles((prev) => ({ ...prev, rev: file }));
    } else if (name.includes("xor") && name.endsWith(".dat")) {
      setFiles((prev) => ({ ...prev, xor: file }));
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      for (const file of dropped) assignFile(file);
    },
    [assignFile],
  );

  const handleAnalyze = async () => {
    if (!allSelected) return;
    setStatus("analyzing");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("blk", files.blk!);
      formData.append("rev", files.rev!);
      formData.append("xor", files.xor!);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const result = await res.json();

      if (result.ok) {
        setStatus("success");
        setTimeout(() => onSuccess(result.stem), 800);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Analysis failed.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — could not reach server.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div
        className="relative flex w-full max-w-lg flex-col rounded-t-xl border bg-background shadow-2xl sm:rounded-xl"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Upload Block Files</h2>
              <p className="text-xs text-muted-foreground">
                Analyze raw Bitcoin block data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status === "analyzing"}
            className="rounded-md p-2 hover:bg-accent transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 py-4">
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5">
              <p className="text-sm font-medium text-primary">
                Drop files here
              </p>
            </div>
          )}

          {FILE_SLOTS.map(({ key, label, hint }) => (
            <FileSlotRow
              key={key}
              label={label}
              hint={hint}
              file={files[key]}
              inputRef={inputRefs[key]}
              disabled={status === "analyzing" || status === "success"}
              onFile={(f) => setFiles((prev) => ({ ...prev, [key]: f }))}
            />
          ))}

          <p className="text-center text-xs text-muted-foreground">
            Drag &amp; drop all files at once — they&apos;ll be matched by name.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4">
          {status === "idle" && (
            <button
              onClick={handleAnalyze}
              disabled={!allSelected}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Analyze
            </button>
          )}

          {status === "analyzing" && (
            <div className="flex items-center justify-center gap-3 py-1">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground">
                Running chain analysis...
              </span>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center justify-center gap-2 py-1 text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Analysis complete</span>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs">{errorMsg}</p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!allSelected}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface FileSlotRowProps {
  label: string;
  hint: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onFile: (f: File | null) => void;
}

function FileSlotRow({ label, hint, file, inputRef, disabled, onFile }: FileSlotRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
      <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        {file ? (
          <p className="truncate text-xs text-muted-foreground">
            {file.name}{" "}
            <span className="text-muted-foreground/60">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60">{hint}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".dat"
        className="hidden"
        disabled={disabled}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      {file && !disabled ? (
        <button
          onClick={() => {
            onFile(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="rounded-md p-1.5 hover:bg-accent transition-colors"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="rounded-md px-3 py-1.5 text-xs font-medium border hover:bg-accent transition-colors disabled:opacity-40"
        >
          Choose
        </button>
      )}
    </div>
  );
}
