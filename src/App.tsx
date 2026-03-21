import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Remix Icons
import { RiDatabase2Line, RiLoader4Line, RiServerLine } from "@remixicon/react";

// UI Components
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

export default function App() {
  // Connection Form State
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("3306");
  const [user, setUser] = useState("root");
  const [pass, setPass] = useState("");

  // App State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [databases, setDatabases] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dbList = await invoke<string[]>("connect_to_db", {
        host,
        port: parseInt(port),
        user,
        pass,
      });

      setDatabases(dbList);
      setIsConnected(true);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================================
  // VIEW 1: The Dashboard (Shows when connected)
  // =========================================================================
  if (isConnected) {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
        {/* Sidebar mimicking phpMyAdmin */}
        <div className="w-64 border-r border-border bg-card p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 font-bold text-lg px-2 text-primary">
            <RiServerLine className="w-5 h-5" />
            {host}:{port}
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Databases
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto">
            {databases.map((db) => (
              <button
                key={db}
                className="text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm flex items-center gap-2 transition-colors"
              >
                <RiDatabase2Line className="w-4 h-4 text-muted-foreground" />
                {db}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          <div className="text-center space-y-2 text-muted-foreground">
            <RiDatabase2Line className="w-12 h-12 mx-auto opacity-20" />
            <h2 className="text-xl font-medium">
              Select a database from the sidebar
            </h2>
            <p className="text-sm">to view its tables and data.</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: The Login Form (Shows initially)
  // =========================================================================
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <RiDatabase2Line className="w-6 h-6 text-primary" />
            MySQL Login
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect to your local or remote database server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnect} className="space-y-4">
            {/* Host and Port Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="user">Username</Label>
              <Input
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="pass">Password</Label>
              <Input
                id="pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {loading ? "Connecting..." : "Connect"}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md text-sm font-medium bg-destructive/15 text-destructive dark:text-destructive-foreground">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
