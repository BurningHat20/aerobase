import {
  RiCodeLine,
  RiDatabase2Line,
  RiLogoutCircleRLine,
  RiServerLine,
  RiSettings2Line,
  RiSignalWifiLine,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConnectionInfo } from "@/types";

interface Props {
  connectionInfo: ConnectionInfo;
  onDisconnect: () => void;
  onNewQuery: () => void;
  onOpenServerInfo: () => void;
}

export default function TopBar({
  connectionInfo,
  onDisconnect,
  onNewQuery,
  onOpenServerInfo,
}: Props) {
  return (
    <TooltipProvider delayDuration={400}>
      <header className="h-9 shrink-0 border-b border-border bg-card/70 backdrop-blur-sm flex items-center justify-between px-3 gap-4">
        {/* Left: brand + connection */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center gap-1.5 font-semibold text-sm text-foreground shrink-0">
            <RiDatabase2Line className="size-4 text-primary" />
            AeroBase
          </span>

          <span className="text-border select-none shrink-0">|</span>

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono truncate min-w-0">
            <RiServerLine className="size-3 shrink-0" />
            {connectionInfo.user}@{connectionInfo.host}:{connectionInfo.port}
          </span>

          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium shrink-0">
            <RiSignalWifiLine className="size-3" />
            Connected
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewQuery}
                className="h-6 px-2 text-muted-foreground hover:text-foreground text-xs gap-1.5"
              >
                <RiCodeLine className="size-3.5" />
                SQL Editor
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              New SQL editor tab (Ctrl+T)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={onOpenServerInfo}
              >
                <RiSettings2Line className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Server info</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnect}
                className="h-6 px-2 text-muted-foreground hover:text-destructive text-xs gap-1.5"
              >
                <RiLogoutCircleRLine className="size-3.5" />
                Disconnect
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close connection</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
