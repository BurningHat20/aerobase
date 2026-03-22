import { Toaster as Sonner } from "@/components/ui/sonner";

/**
 * Global toast container -- mount once in App.tsx.
 * Uses "system" theme to auto-follow the app's light/dark class.
 */
export default function Toaster() {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      gap={6}
      toastOptions={{
        classNames: {
          toast:
            "bg-card border border-border text-foreground text-xs shadow-lg rounded-lg",
          title: "text-xs font-medium",
          description: "text-[11px] text-muted-foreground",
          success: "border-success/30",
          error: "border-destructive/30",
        },
      }}
    />
  );
}
