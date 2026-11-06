import Logo from "../Logo";
import NavItem from "./NavItem";
import { CameraGroupSelector } from "../filter/CameraGroupSelector";
import { Link, useMatch } from "react-router-dom";
import GeneralSettings from "../menu/GeneralSettings";
import AccountSettings from "../menu/AccountSettings";
import useNavigation from "@/hooks/use-navigation";
import { baseUrl } from "@/api/baseUrl";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  preferenceLoaded: boolean;
};

function Sidebar({ collapsed, onToggle, preferenceLoaded }: SidebarProps) {
  const { t } = useTranslation("common");
  const basePath = useMemo(() => new URL(baseUrl).pathname, []);

  const isRootMatch = useMatch("/");
  const isBasePathMatch = useMatch(basePath);

  const navbarLinks = useNavigation();

  return (
    <aside
      aria-label={t("sidebar.navigation")}
      className="scrollbar-container scrollbar-hidden absolute inset-y-0 left-0 z-10 flex w-[var(--architel-sidebar-width)] flex-col justify-between overflow-y-auto border-r border-secondary-highlight bg-background_alt py-4"
    >
      <span tabIndex={0} className="sr-only" />
      <div className="flex w-full flex-col items-center gap-0">
        <Link
          to="/"
          aria-label={t("brand.name")}
          className="mb-6 flex min-h-8 items-center px-2"
        >
          <Logo
            horizontal={!collapsed}
            className={collapsed ? "h-8 w-8" : "w-full"}
          />
        </Link>
        {navbarLinks.map((item) => {
          const showCameraGroups =
            (isRootMatch || isBasePathMatch) && item.id === 1;

          return (
            <div
              key={item.id}
              className={cn(
                "flex flex-col items-center",
                !collapsed && "w-full px-2",
              )}
            >
              <NavItem
                className={cn(
                  collapsed && "mx-[10px]",
                  showCameraGroups ? "mb-2" : "mb-4",
                )}
                showLabel={!collapsed}
                item={item}
                Icon={item.icon}
              />
              {showCameraGroups && <CameraGroupSelector className="mb-4" />}
            </div>
          );
        })}
      </div>
      <div className="mb-8 flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              disabled={!preferenceLoaded}
              aria-label={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
              aria-expanded={!collapsed}
              className={cn(
                "gap-3",
                !collapsed && "w-[calc(100%-1rem)] justify-start px-3",
              )}
            >
              {collapsed ? (
                <LuPanelLeftOpen className="size-5 shrink-0" />
              ) : (
                <LuPanelLeftClose className="size-5 shrink-0" />
              )}
              {!collapsed && <span>{t("sidebar.collapse")}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
          </TooltipContent>
        </Tooltip>
        <GeneralSettings />
        <AccountSettings />
      </div>
    </aside>
  );
}

export default Sidebar;
