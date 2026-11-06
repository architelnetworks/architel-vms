import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type LogoProps = {
  className?: string;
  horizontal?: boolean;
};

export default function Logo({ className, horizontal = false }: LogoProps) {
  const { t } = useTranslation("common");

  // Plain text until the official artwork listed in BRANDING.md is supplied.
  return (
    <span
      role="img"
      aria-label={t("brand.name")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold",
        horizontal ? "whitespace-nowrap text-lg" : "text-xs",
        className,
      )}
    >
      {t(horizontal ? "brand.name" : "brand.shortName")}
    </span>
  );
}
