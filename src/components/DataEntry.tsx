import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onClose: () => void;
  error: string;
  busy: boolean;
}

export function DataEntry({
  value,
  onChange,
  onRun,
  onClose,
  error,
  busy,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    textarea.current?.focus();
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        panel.current?.contains(target) ||
        target.closest("[data-data-trigger]")
      )
        return;
      close.current();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      opener?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <section
      ref={panel}
      className="data-entry"
      aria-label="G25 coordinate data"
      id="coordinate-panel"
    >
      <div className="data-heading">
        <label htmlFor="g25-input">G25 coordinates</label>
        <button
          className="icon-button"
          title="Close coordinate data"
          aria-label="Close coordinate data"
          onClick={onClose}
        >
          <X size={15} />
        </button>
      </div>
      <p id="coordinate-hint">
        One sample per line: name, then 25 comma-separated values. A name like{" "}
        <code>Group:sample</code> sets its group.
      </p>
      <textarea
        ref={textarea}
        id="g25-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            if (!busy) onRun();
          }
        }}
        spellCheck={false}
        aria-describedby={`coordinate-hint${error ? " coordinate-error" : ""}`}
        aria-invalid={!!error}
        placeholder="Group:sample,0.123456,0.098765,… (25 coordinates)"
      />
      {error && (
        <p className="input-error" id="coordinate-error" role="alert">
          {error}
        </p>
      )}
      <div className="data-footer">
        <span>Processed in your browser · Ctrl+Enter to run</span>
        <button className="button run-button" disabled={busy} onClick={onRun}>
          {busy ? "Calculating…" : "Run PCA"}
        </button>
      </div>
    </section>
  );
}
