import Link from "next/link";
import BrandLogoImage from "@/components/brand/BrandLogoImage";

type LogoProps = {
  variant?: "default" | "light";
  compact?: boolean;
};

export default function Logo({ variant = "default", compact = false }: LogoProps) {
  const mutedClass = variant === "light" ? "text-slate-400" : "text-muted";
  const clueClass = variant === "light" ? "text-white" : "text-foreground";

  return (
    <Link
      href="/"
      className={`group flex shrink-0 items-center ${compact ? "gap-2" : "gap-2.5"}`}
    >
      <BrandLogoImage
        size={compact ? "xs" : "sm"}
        className={
          compact
            ? "opacity-95 transition-opacity group-hover:opacity-100"
            : "transition-transform duration-300 group-hover:scale-105"
        }
        noShadow={compact}
      />
      <span
        className={`font-semibold tracking-tight ${
          compact ? "text-base" : "text-xl font-bold"
        }`}
      >
        <span className={mutedClass}>Data</span>
        <span className={clueClass}>clue</span>
      </span>
    </Link>
  );
}
