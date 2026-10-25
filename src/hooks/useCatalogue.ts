import { useEffect, useMemo, useRef, useState } from "react";
import {
  manualRows,
  selectedRows,
  toggleGroup,
  toggleSample,
  tokenKey,
  type CatalogueRow,
  type DatabaseImport,
  type SelectionToken,
} from "../domain/database";
import type { Scaling } from "../domain/g25";

export function useCatalogue() {
  const [database, setDatabase] = useState<DatabaseImport | null>(null);
  const [manual, setManual] = useState<CatalogueRow[]>([]);
  const [tokens, setTokens] = useState<SelectionToken[]>([]);
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false),
    [databaseError, setDatabaseError] = useState("");
  const [text, setText] = useState(""),
    [manualScaling, setManualScaling] = useState<Scaling>("scaled");
  const [manualError, setManualError] = useState("");
  const importer = useRef<Worker | null>(null),
    importId = useRef(0);
  useEffect(
    () => () => {
      importId.current++;
      importer.current?.terminate();
    },
    [],
  );
  const rows = useMemo(
    () => [...(database?.rows ?? []), ...manual],
    [database, manual],
  );
  const selected = useMemo(() => selectedRows(rows, tokens), [rows, tokens]);

  async function loadDatabase(file: File, scaling: Scaling) {
    const id = ++importId.current;
    importer.current?.terminate();
    importer.current = null;
    setLoading(true);
    setDatabaseError("");
    try {
      const text = await file.text();
      if (id !== importId.current) return;
      const next = new Worker(
        new URL("../workers/database.worker.ts", import.meta.url),
        { type: "module" },
      );
      importer.current = next;
      const finish = () => {
        next.terminate();
        importer.current = null;
        setLoading(false);
      };
      next.onmessage = (
        event: MessageEvent<{ result?: DatabaseImport; error?: string }>,
      ) => {
        if (id !== importId.current) return;
        if (event.data.result) {
          const incoming = event.data.result;
          const names = new Set(manual.map((row) => row.sample.name));
          const overlap = incoming.rows.find((row) =>
            names.has(row.sample.name),
          );
          if (overlap)
            setDatabaseError(
              `“${overlap.sample.name}” is already loaded manually. Clear its manual selection before replacing the database.`,
            );
          else {
            setDatabase(incoming);
            setFilename(file.name);
            setTokens((current) =>
              current.filter((token) =>
                token.kind === "group"
                  ? token.origin === "manual"
                  : token.value.startsWith("manual:"),
              ),
            );
          }
        } else
          setDatabaseError(
            event.data.error ??
              "Could not load this TSV. The previous database is still available.",
          );
        finish();
      };
      next.onerror = () => {
        if (id !== importId.current) return;
        setDatabaseError(
          "The database could not be loaded. Try selecting the TSV again.",
        );
        finish();
      };
      next.postMessage({ text, scaling });
    } catch (error) {
      if (id !== importId.current) return;
      setDatabaseError(
        error instanceof Error ? error.message : "Could not read this file.",
      );
      setLoading(false);
    }
  }
  function addManual() {
    try {
      // Re-pasting identical manual rows reselects them; conflicting coordinates are rejected.
      const incoming = manualRows(text, manualScaling, database?.rows ?? []);
      const existing = new Map(manual.map((row) => [row.id, row]));
      for (const row of incoming) {
        const old = existing.get(row.id);
        if (old && old.sample.scaled.some((n, i) => n !== row.sample.scaled[i]))
          throw new Error(
            `“${row.sample.name}” already has different manual coordinates. Use a distinct sample ID.`,
          );
        existing.set(row.id, row);
      }
      const nextManual = [...existing.values()];
      setManual(nextManual);
      setTokens((current) => {
        let next = [...current];
        for (const group of new Set(incoming.map((row) => row.group))) {
          // Select just newly pasted rows; a whole manual population gets one chip.
          const groupRows = nextManual.filter((row) => row.group === group);
          const addedIds = new Set(
            incoming.filter((row) => row.group === group).map((row) => row.id),
          );
          const selectedIds = new Set(
            selectedRows(rows, current).map((row) => row.id),
          );
          next = next.filter((token) =>
            token.kind === "sample"
              ? !groupRows.some((row) => row.id === token.value)
              : !(token.origin === "manual" && token.value === group),
          );
          next.push({
            kind: "group",
            value: group,
            origin: "manual",
            excluded: groupRows
              .filter(
                (row) => !addedIds.has(row.id) && !selectedIds.has(row.id),
              )
              .map((row) => row.id),
          });
        }
        return next;
      });
      setText("");
      setManualError("");
      return true;
    } catch (error) {
      setManualError(
        error instanceof Error ? error.message : "Check the pasted G25 rows.",
      );
      return false;
    }
  }
  function removeToken(token: SelectionToken) {
    setTokens((current) =>
      current.filter((t) => tokenKey(t) !== tokenKey(token)),
    );
  }
  return {
    database,
    rows,
    tokens,
    selected,
    filename,
    loading,
    databaseError,
    loadDatabase,
    text,
    setText,
    manualScaling,
    setManualScaling,
    manualError,
    setManualError,
    addManual,
    removeToken,
    clearSelection: () => {
      setTokens([]);
      setManual([]);
    },
    group: (group: string, origin: CatalogueRow["origin"]) =>
      setTokens((current) => toggleGroup(rows, current, group, origin)),
    sample: (row: CatalogueRow) =>
      setTokens((current) => toggleSample(rows, current, row)),
  };
}
export type CatalogueState = ReturnType<typeof useCatalogue>;
