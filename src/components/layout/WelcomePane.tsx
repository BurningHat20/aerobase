import { RiDatabase2Line } from "@remixicon/react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export default function WelcomePane({ dbCount }: { dbCount: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 select-none p-8">
      <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <RiDatabase2Line className="size-7 text-muted-foreground/15" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-sm font-medium text-muted-foreground/60">
          {dbCount} database{dbCount !== 1 ? "s" : ""} connected
        </p>
        <p className="text-xs text-muted-foreground/30 flex items-center gap-1.5 justify-center">
          Select a table or press{" "}
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>{" "}
          to search
        </p>
      </div>
    </div>
  );
}
