import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiCloseLine,
  RiDatabase2Line,
  RiEyeLine,
  RiEyeOffLine,
  RiFlashlightLine,
  RiLoader4Fill,
  RiMoonLine,
  RiSaveLine,
  RiSunLine,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConnectionInfo, ConnectionProfile } from "@/types";
import type { Theme } from "@/hooks/useTheme";

const uid = () => Math.random().toString(36).slice(2, 10);

interface Props {
  onConnect: (info: ConnectionInfo, databases: string[]) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export default function LoginPage({ onConnect, theme, toggleTheme }: Props) {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("3306");
  const [user, setUser] = useState("root");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);

  useEffect(() => {
    invoke<ConnectionProfile[]>("get_profiles")
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, []);

  const handleConnect = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      try {
        const dbs = await invoke<string[]>("connect_to_db", {
          host: host.trim(),
          port: parseInt(port, 10),
          user: user.trim(),
          pass,
        });
        onConnect({ host: host.trim(), port, user: user.trim() }, dbs);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [host, port, user, pass, onConnect]
  );

  const saveProfile = useCallback(async () => {
    const exists = profiles.find(
      (p) =>
        p.host === host.trim() &&
        p.port === parseInt(port) &&
        p.user === user.trim()
    );
    if (exists) {
      toast.info("Connection already saved");
      return;
    }
    const profile: ConnectionProfile = {
      id: uid(),
      name: `${user.trim()}@${host.trim()}:${port}`,
      host: host.trim(),
      port: parseInt(port, 10),
      user: user.trim(),
    };
    try {
      await invoke("save_profile", { profile });
      setProfiles((p) => [...p, profile]);
      toast.success("Connection saved");
    } catch (err) {
      toast.error(String(err));
    }
  }, [host, port, user, profiles]);

  const deleteProfile = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("delete_profile", { id });
      setProfiles((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(String(err));
    }
  }, []);

  return (
    <main className="h-screen bg-background flex items-center justify-center relative overflow-hidden select-none noise-bg">
      {/* Subtle ambient glow — neutral */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_-5%,rgba(255,255,255,0.04),transparent)]" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-colors"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <RiSunLine className="size-4" />
        ) : (
          <RiMoonLine className="size-4" />
        )}
      </button>

      {/* Center card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-foreground text-background mb-3">
            <RiDatabase2Line className="size-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            AeroBase
          </h1>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            Modern MySQL Client
          </p>
        </div>

        {/* Saved profiles */}
        {profiles.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30 mb-2 px-0.5">
              Saved connections
            </p>
            <div className="space-y-1">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setHost(p.host);
                    setPort(String(p.port));
                    setUser(p.user);
                    setPass("");
                    setError("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50 bg-card/50 hover:bg-accent hover:border-primary/20 transition-all text-left group"
                >
                  <RiFlashlightLine className="size-3.5 text-primary/40 shrink-0 group-hover:text-primary transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-foreground/80 truncate">
                      {p.user}@{p.host}:{p.port}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteProfile(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/15 hover:text-destructive text-muted-foreground/30 transition-all"
                  >
                    <RiCloseLine className="size-3" />
                  </button>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground/30 font-medium">
                or connect manually
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
          </div>
        )}

        {/* Login form */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
          <form onSubmit={handleConnect} className="px-5 py-5 space-y-3.5">
            {/* Host + Port */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-3 space-y-1.5">
                <Label htmlFor="host" className="text-[11px] font-medium text-muted-foreground">
                  Host
                </Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="h-9 text-sm"
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor="port" className="text-[11px] font-medium text-muted-foreground">
                  Port
                </Label>
                <Input
                  id="port"
                  type="number"
                  min={1}
                  max={65535}
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="h-8 text-[12px] font-mono"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="user" className="text-[11px] font-medium text-muted-foreground">
                Username
              </Label>
              <Input
                id="user"
                placeholder="root"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="h-9 text-sm"
                required
                autoComplete="username"
                spellCheck={false}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="pass" className="text-[11px] font-medium text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="pass"
                  type={showPass ? "text" : "password"}
                  placeholder="Leave empty if none"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="h-9 text-sm pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                >
                  {showPass ? (
                    <RiEyeOffLine className="size-3.5" />
                  ) : (
                    <RiEyeLine className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/8 text-destructive border border-destructive/15 text-[11px]">
                <RiAlertLine className="size-3.5 shrink-0 mt-px" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={saveProfile}
                title="Save connection (without password)"
              >
                <RiSaveLine className="size-3" />
                Save
              </Button>

              <Button
                type="submit"
                className="flex-1 h-9 gap-2 font-medium text-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RiLoader4Fill className="size-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect
                    <RiArrowRightLine className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-muted-foreground/20 mt-4">
          v0.1.0
        </p>
      </div>
    </main>
  );
}
