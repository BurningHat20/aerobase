import {
  RiCodeLine,
  RiDatabase2Line,
  RiLogoutCircleRLine,
  RiMoonLine,
  RiServerLine,
  RiSettings2Line,
  RiSignalWifiFill,
  RiSunLine,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
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
  theme: Theme;
  toggleTheme: () => void;
}

export default function TopBar({
  connectionInfo,
  onDisconnect,
  onNewQuery,
  onOpenServerInfo,
  theme,
  toggleTheme,
}: Props) {
  return (
    <TooltipProvider delayDuration={600}>
      <header className="h-10 shrink-0 border-b border-border bg-card flex items-center px-3 gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="size-6 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <RiDatabase2Line className="size-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            AeroBase
          </span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Connection badge */}
        <div className="flex items-center gap-1.5 min-w-0">
          <RiServerLine className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground font-mono truncate">
            {connectionInfo.user}@{connectionInfo.host}:{connectionInfo.port}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium shrink-0 ml-1">
            <RiSignalWifiFill className="size-2.5" />
            Live
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
                onClick={onNewQuery}
              >
                <RiCodeLine className="size-3.5" />
                <span className="hidden sm:inline">SQL Editor</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              New SQL editor{" "}
              <kbd className="ml-1 text-[10px] px-1 py-px rounded bg-muted font-mono">
                Ctrl+T
              </kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={onOpenServerInfo}
              >
                <RiSettings2Line className="size-3.5" />
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
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <RiSunLine className="size-3.5" />
                ) : (
                  <RiMoonLine className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1.5 rounded-lg"
                onClick={onDisconnect}
              >
                <RiLogoutCircleRLine className="size-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Close connection
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
