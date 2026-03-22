import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiDatabase2Line,
  RiLoader4Line,
  RiPlugLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiShieldKeyholeLine,
  RiAlertLine,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ConnectionInfo } from "@/types";

interface Props {
  onConnect: (info: ConnectionInfo, databases: string[]) => void;
}

export default function LoginPage({ onConnect }: Props) {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("3306");
  const [user, setUser] = useState("root");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        const dbList = await invoke<string[]>("connect_to_db", {
          host: host.trim(),
          port: parseInt(port, 10),
          user: user.trim(),
          pass,
        });
        onConnect({ host: host.trim(), port, user: user.trim() }, dbList);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [host, port, user, pass, onConnect]
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(oklch(1 0 0 / 15%) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative w-full max-w-sm space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-border shadow-sm">
            <RiDatabase2Line className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AeroBase
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modern MySQL client
            </p>
          </div>
        </div>

        {/* Connection card */}
        <Card className="border-border/60 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <RiPlugLine className="w-3.5 h-3.5 text-muted-foreground" />
              New Connection
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your MySQL server credentials
            </CardDescription>
          </CardHeader>

          <CardContent className="px-5 pb-5">
            <form onSubmit={handleConnect} className="space-y-3.5">
              {/* Host + Port */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="col-span-3 space-y-1.5">
                  <Label htmlFor="host" className="text-xs font-medium text-foreground/80">
                    Host
                  </Label>
                  <Input
                    id="host"
                    placeholder="localhost"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="h-8 text-sm bg-background/60"
                    required
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Label htmlFor="port" className="text-xs font-medium text-foreground/80">
                    Port
                  </Label>
                  <Input
                    id="port"
                    type="number"
                    min={1}
                    max={65535}
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="h-8 text-sm bg-background/60"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="user" className="text-xs font-medium text-foreground/80">
                  Username
                </Label>
                <Input
                  id="user"
                  placeholder="root"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="h-8 text-sm bg-background/60"
                  required
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="pass" className="text-xs font-medium text-foreground/80">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="pass"
                    type={showPass ? "text" : "password"}
                    placeholder="Leave empty if none"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="h-8 text-sm pr-9 bg-background/60"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? (
                      <RiEyeOffLine className="w-3.5 h-3.5" />
                    ) : (
                      <RiEyeLine className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-md text-xs bg-destructive/10 text-destructive border border-destructive/25">
                  <RiAlertLine className="size-3.5 shrink-0 mt-px" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="border-t border-border/60 pt-1" />

              <Button
                type="submit"
                className="w-full h-8 text-sm font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RiLoader4Line className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <RiArrowRightLine className="w-3.5 h-3.5 mr-1.5" />
                    Connect
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50">
          <RiShieldKeyholeLine className="w-3 h-3" />
          Credentials never leave your device
        </div>
      </div>
    </main>
  );
}