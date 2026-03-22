import {
  RiCodeLine,
  RiLogoutCircleRLine,
  RiMoonLine,
  RiSearchLine,
  RiServerLine,
  RiSunLine,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Theme } from "@/hooks/useTheme";
import type { ConnectionInfo } from "@/types";

interface Props {
  connectionInfo: ConnectionInfo;
  onDisconnect: () => void;
  onNewQuery: () => void;
  onOpenServerInfo: () => void;
  onOpenCommandPalette: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export default function TopBar({
  connectionInfo,
  onDisconnect,
  onNewQuery,
  onOpenServerInfo,
  onOpenCommandPalette,
  theme,
  toggleTheme,
}: Props) {
  return (
    <TooltipProvider delayDuration={400}>
      <header className="h-12 shrink-0 border-b border-border bg-card flex items-center px-4 gap-3 select-none">
        {/* Connection status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex size-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span className="text-sm text-muted-foreground font-mono truncate">
            {connectionInfo.user}
            <span className="text-foreground/20">@</span>
            {connectionInfo.host}
            <span className="text-foreground/20">:</span>
            {connectionInfo.port}
          </span>
        </div>

        <div className="flex-1" />

        {/* Command palette */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs text-muted-foreground gap-2 bg-transparent hover:bg-accent"
          onClick={onOpenCommandPalette}
        >
          <RiSearchLine className="size-3.5" />
          <span className="hidden sm:inline">Search</span>
          <KbdGroup className="hidden sm:inline-flex ml-0.5">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>

        <Separator orientation="vertical" className="h-4" />

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-2"
                onClick={onNewQuery}
              >
                <RiCodeLine className="size-4" />
                <span className="hidden sm:inline">SQL</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              New SQL Editor{" "}
              <KbdGroup className="ml-1">
                <Kbd>Ctrl</Kbd>
                <Kbd>T</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={onOpenServerInfo}
              >
                <RiServerLine className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Server info
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <RiSunLine className="size-4" />
                ) : (
                  <RiMoonLine className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={onDisconnect}
              >
                <RiLogoutCircleRLine className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Disconnect
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
