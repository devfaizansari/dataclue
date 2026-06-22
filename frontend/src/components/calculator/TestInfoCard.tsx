type TestInfoCardProps = {
  title: string;
  description: string;
};

export default function TestInfoCard({ title, description }: TestInfoCardProps) {
  return (
    <div className="relative rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <button
        type="button"
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        aria-label="More information"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <h2 className="pr-10 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
