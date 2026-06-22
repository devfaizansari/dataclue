import Image from "next/image";

export const BRAND_LOGO_PATH = "/brand/dataclue-logo.png";

const sizeMap = {
  xs: 28,
  sm: 36,
  md: 72,
  lg: 120,
} as const;

type BrandLogoImageProps = {
  size?: keyof typeof sizeMap;
  className?: string;
  priority?: boolean;
  noShadow?: boolean;
};

export default function BrandLogoImage({
  size = "md",
  className = "",
  priority = false,
  noShadow = false,
}: BrandLogoImageProps) {
  const px = sizeMap[size];

  return (
    <Image
      src={BRAND_LOGO_PATH}
      alt="dataclue"
      width={px}
      height={px}
      priority={priority}
      unoptimized
      className={`object-contain ${noShadow ? "" : "drop-shadow-[0_6px_20px_rgba(37,99,235,0.28)]"} ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
