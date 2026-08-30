import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  className?: string;
  priority?: boolean;
}

const sizeMap: Record<"sm" | "md" | "lg" | "xl", { width: number; height: number }> = {
  sm: { width: 144, height: 48 },
  md: { width: 195, height: 56 },
  lg: { width: 280, height: 90 },
  xl: { width: 360, height: 120 },
};

export function Logo({
  size = "md",
  href = "/dashboard",
  className,
  priority = true,
}: LogoProps) {
  const dimensions = sizeMap[size] ?? sizeMap.md;

  const content = (
    <span className={cn("inline-flex items-center select-none", className)}>
      <Image
        src="/amz-light-theme-logo.png"
        alt="AMZETIX"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className="theme-logo-light h-auto w-auto object-contain"
        style={{
          maxHeight: `${dimensions.height}px`,
          maxWidth: `${dimensions.width}px`,
        }}
      />
      <Image
        src="/amz-dark-theme-logo.png"
        alt="AMZETIX"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className="theme-logo-dark h-auto w-auto object-contain"
        style={{
          maxHeight: `${dimensions.height}px`,
          maxWidth: `${dimensions.width}px`,
        }}
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

interface LogoIconProps {
  size?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
}

export function LogoIcon({
  size = 36,
  href = "/dashboard",
  className,
  priority = true,
}: LogoIconProps) {
  const content = (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-white shadow-xs p-1.5 overflow-hidden shrink-0 border border-[var(--border-default)]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/favicon.png"
        alt="AMZETIX"
        width={size}
        height={size}
        priority={priority}
        className="object-contain w-full h-full"
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
