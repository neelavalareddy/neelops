import Image from "next/image";
import classifyLogo from "@/app/classify-logo.png";

type BrandLogoProps = {
  className?: string;
  size?: number;
};

export default function BrandLogo({ className, size = 32 }: BrandLogoProps) {
  return (
    <Image
      alt="Classify logo"
      className={className}
      height={Math.round((size * 610) / 409)}
      priority
      src={classifyLogo}
      width={size}
    />
  );
}
