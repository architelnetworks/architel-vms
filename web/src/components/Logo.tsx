import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { baseUrl } from "@/api/baseUrl";

type LogoProps = {
  className?: string;
  horizontal?: boolean;
};

export default function Logo({ className, horizontal = false }: LogoProps) {
  const { t } = useTranslation("common");

  return (
    <span
      role="img"
      aria-label={t("brand.name")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold",
        horizontal ? "gap-2 whitespace-nowrap text-lg" : "size-8",
        className,
      )}
    >
      <img
        src={`${baseUrl}images/branding/hexagon.svg`}
        alt=""
        aria-hidden="true"
        className={cn(
          "dark:invert",
          horizontal ? "size-6 shrink-0" : "size-full",
        )}
      />
      {horizontal && <span>{t("brand.name")}</span>}
    </span>
  );
}
