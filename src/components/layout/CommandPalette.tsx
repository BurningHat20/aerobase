import { useEffect, useState } from "react";
import {
  RiCodeLine,
  RiDatabase2Line,
  RiLogoutCircleRLine,
  RiMoonLine,
  RiServerLine,
  RiSunLine,
  RiTableLine,
} from "@remixicon/react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { ConnectionInfo, Theme } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  databases: string[];
  tables: Record<string, string[]>;
  connectionInfo: ConnectionInfo;
  onOpenTable: (db: string, table: string) => void;
  onOpenQuery: (db: string) => void;
  onOpenServerInfo: () => void;
  onDisconnect: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
  databases,
  tables,
  connectionInfo,
  onOpenTable,
  onOpenQuery,
  onOpenServerInfo,
  onDisconnect,
  theme,
  toggleTheme,
}: Props) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const close = () => onOpenChange(false);

  // Flatten all tables for search
  const allTables: { db: string; table: string }[] = [];
  for (const db of databases) {
    for (const tbl of tables[db] ?? []) {
      allTables.push({ db, table: tbl });
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search tables, databases, actions..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {allTables.length > 0 && (
          <CommandGroup heading="Tables">
            {allTables.slice(0, 20).map(({ db, table }) => (
              <CommandItem
                key={`${db}.${table}`}
                value={`${db} ${table}`}
                onSelect={() => {
                  onOpenTable(db, table);
                  close();
                }}
              >
                <RiTableLine className="size-3.5 text-muted-foreground" />
                <span className="flex-1 truncate">{table}</span>
                <CommandShortcut className="font-mono">{db}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading={`Databases on ${connectionInfo.host}`}>
          {databases.map((db) => (
            <CommandItem
              key={db}
              value={`database ${db}`}
              onSelect={() => {
                onOpenQuery(db);
                close();
              }}
            >
              <RiDatabase2Line className="size-3.5 text-muted-foreground" />
              <span className="flex-1">{db}</span>
              <CommandShortcut>New query</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            value="new sql editor query"
            onSelect={() => {
              onOpenQuery(databases[0] ?? "");
              close();
            }}
          >
            <RiCodeLine className="size-3.5 text-muted-foreground" />
            <span className="flex-1">New SQL Editor</span>
            <CommandShortcut>
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>T</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
          <CommandItem
            value="server info"
            onSelect={() => {
              onOpenServerInfo();
              close();
            }}
          >
            <RiServerLine className="size-3.5 text-muted-foreground" />
            Server Info
          </CommandItem>
          <CommandItem
            value="toggle theme dark light"
            onSelect={() => {
              toggleTheme();
              close();
            }}
          >
            {theme === "dark" ? (
              <RiSunLine className="size-3.5 text-muted-foreground" />
            ) : (
              <RiMoonLine className="size-3.5 text-muted-foreground" />
            )}
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </CommandItem>
          <CommandSeparator />
          <CommandItem
            value="disconnect close"
            onSelect={() => {
              onDisconnect();
              close();
            }}
          >
            <RiLogoutCircleRLine className="size-3.5 text-destructive" />
            <span className="text-destructive">Disconnect</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
