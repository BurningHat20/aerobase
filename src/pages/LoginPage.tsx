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
  RiShieldCheckLine,
  RiSunLine,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    <main className="h-screen bg-background flex items-center justify-center relative overflow-hidden select-none">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />
      {/* Radial vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_40%,var(--background)_100%)]" />

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary text-primary-foreground shadow-lg mb-4">
            <RiDatabase2Line className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AeroBase
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modern MySQL client
          </p>
        </div>

        {/* Saved profiles */}
        {profiles.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2 px-0.5">
              Saved connections
            </p>
            <div className="space-y-1.5">
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
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left group"
                >
                  <RiFlashlightLine className="size-4 text-primary/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {p.user}@{p.host}:{p.port}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteProfile(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/15 hover:text-destructive text-muted-foreground/40 transition-all"
                  >
                    <RiCloseLine className="size-3.5" />
                  </button>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 my-5">
              <Separator className="flex-1" />
              <span className="text-[11px] text-muted-foreground/50 font-medium">
                or connect manually
              </span>
              <Separator className="flex-1" />
            </div>
          </div>
        )}

        {/* Login form */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-1">
            <h2 className="text-sm font-semibold text-foreground">
              New Connection
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your MySQL server credentials
            </p>
          </div>

          <form onSubmit={handleConnect} className="px-5 pb-5 pt-4 space-y-4">
            {/* Host + Port */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3 space-y-1.5">
                <Label htmlFor="host" className="text-xs font-medium">
                  Host
                </Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="h-9 font-mono text-sm"
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor="port" className="text-xs font-medium">
                  Port
                </Label>
                <Input
                  id="port"
                  type="number"
                  min={1}
                  max={65535}
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="h-9 font-mono text-sm"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="user" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="user"
                placeholder="root"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="h-9 font-mono text-sm"
                required
                autoComplete="username"
                spellCheck={false}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="pass" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="pass"
                  type={showPass ? "text" : "password"}
                  placeholder="Leave empty if none"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="h-9 font-mono text-sm pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? (
                    <RiEyeOffLine className="size-4" />
                  ) : (
                    <RiEyeLine className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                <RiAlertLine className="size-3.5 shrink-0 mt-px" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <Separator />

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
                <RiSaveLine className="size-3.5" />
                Save
              </Button>

              <Button
                type="submit"
                className="flex-1 h-9 gap-2 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RiLoader4Fill className="size-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <RiArrowRightLine className="size-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-muted-foreground/50">
          <RiShieldCheckLine className="size-3.5" />
          Passwords are never saved to disk
        </div>
      </div>
    </main>
  );
}
