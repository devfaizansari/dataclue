"use client";

import Link from "next/link";

export type BlogMessageModalState = {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
};

type BlogMessageModalProps = {
  modal: BlogMessageModalState;
  onClose: () => void;
};

export default function BlogMessageModal({ modal, onClose }: BlogMessageModalProps) {
  if (!modal.open) return null;

  const isSuccess = modal.type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close message dialog"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-message-title"
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="px-5 py-5 sm:px-6">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              isSuccess
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
            }`}
          >
            {isSuccess ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h2
            id="blog-message-title"
            className="mt-4 text-center text-lg font-semibold text-foreground"
          >
            {modal.title}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted">{modal.message}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-center sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
              isSuccess
                ? "bg-primary text-white hover:bg-primary-dark"
                : "border border-border text-foreground hover:bg-surface-muted"
            }`}
          >
            OK
          </button>
          {isSuccess ? (
            <Link
              href="/admin/blogs"
              className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Go to blog list
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
