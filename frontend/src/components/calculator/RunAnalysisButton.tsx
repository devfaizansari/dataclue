type RunAnalysisButtonProps = {
  loading?: boolean;
  onClick: () => void;
  className?: string;
};

export default function RunAnalysisButton({
  loading = false,
  onClick,
  className = "",
}: RunAnalysisButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 btn-motion ${className}`}
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
      {loading ? "Running…" : "Run Analysis"}
    </button>
  );
}
