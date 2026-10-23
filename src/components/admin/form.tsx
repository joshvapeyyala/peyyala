"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useEffectEvent, useId, useState, useTransition, type ComponentProps } from "react";
import { maxUploadBytes, type FieldErrors, type SaveResult } from "@/lib/schemas";
import { LeaveGuard } from "./leave-guard";
import { Button, buttonBase, buttonStyles, sectionId } from "./ui";

// Form controls for the admin. Each screen keeps all its values in one piece
// of React state (useEditor) and sends it whole to its server action on save.

const control =
  "w-full rounded-lg border border-border-strong bg-panel px-3 text-sm text-fg placeholder:text-muted/70 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

// ---- Editor state ----

type Failure<T> = { value: T; message: string; errors: FieldErrors };

// The values being edited, whether they differ from what's saved, and saving.
// `save` is the screen's server action; it returns the cleaned-up values it
// stored (shown from then on), or the problems to show beside each field.
export function useEditor<T>(initial: T, save: (value: T) => Promise<SaveResult<T>>) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  // The last failed save. Its errors stay beside their fields until those are edited.
  const [failure, setFailure] = useState<Failure<T> | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = !isEqual(value, saved);

  // After a failed save, bring the first field with a problem into view. An
  // effect, because the save's transition draws the errors after it resolves.
  // Only visible fields: Next.js keeps recently visited pages mounted but hidden.
  useEffect(() => {
    if (!failure) return;
    const fields = document.querySelectorAll<HTMLElement>('[aria-invalid="true"]');
    [...fields].find((field) => field.checkVisibility())?.focus();
  }, [failure]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [justSaved]);

  function submit() {
    if (pending || !dirty) return;
    const submitted = value;
    setJustSaved(false);
    startTransition(async () => {
      let result: SaveResult<T>;
      try {
        result = await save(submitted);
      } catch (error) {
        // Redirects (a new project's page, or the login page when signed out) belong to Next.js
        unstable_rethrow(error);
        result = { ok: false, message: "Couldn't reach the server. Check your connection and try again.", errors: {} };
      }
      if (result.ok) {
        const stored = result.value ?? submitted;
        setSaved(stored);
        // Keep anything typed while the save was on its way
        setValue((current) => (current === submitted ? stored : current));
        setFailure(null);
        setJustSaved(true);
      } else {
        setFailure({ value: submitted, ...result });
      }
    });
  }

  // The error for one field, e.g. errorAt("experience.0.company")
  function errorAt(path: string) {
    const message = failure?.errors[path];
    return message && isEqual(pick(value, path), pick(failure.value, path)) ? message : undefined;
  }

  // The first error for a field or anything inside it, e.g. one bad tag in a list
  function errorWithin(path: string) {
    const nested = Object.keys(failure?.errors ?? {}).filter((key) => key === path || key.startsWith(`${path}.`));
    return nested.map(errorAt).find(Boolean);
  }

  return {
    value,
    set: setValue,
    update: (patch: Partial<T>) => setValue((current) => ({ ...current, ...patch })),
    dirty,
    pending,
    justSaved: justSaved && !dirty,
    message: failure?.message,
    submit,
    discard() {
      setValue(saved);
      setFailure(null);
    },
    // The server now holds these values (e.g. after an upload). Fields still
    // showing the old saved value take the new one; edits in progress stay.
    rebase(patch: Partial<T>) {
      const next = { ...saved, ...patch };
      setSaved(next);
      setValue((current) => {
        const merged = { ...current };
        for (const key of Object.keys(patch) as (keyof T)[]) if (isEqual(current[key], saved[key])) merged[key] = next[key];
        return merged;
      });
    },
    errorAt,
    errorWithin,
  };
}

export type Editor<T> = ReturnType<typeof useEditor<T>>;

// Plain data only: objects, arrays, strings, numbers, booleans
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return keysA.length === keysB.length && keysA.every((key) => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

function pick(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined), value);
}

// ---- Fields ----

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  // Shows "length / recommended" beside the hint, turning amber past it
  count?: { length: number; recommended: number };
  children: (control: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => React.ReactNode;
};

export function Field({ label, hint, error, count, children }: FieldProps) {
  const id = useId();
  const over = count && count.length > count.recommended;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, ...(error && { "aria-invalid": true, "aria-describedby": `${id}-error` }) })}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {(hint || count) && (
        <div className="flex justify-between gap-3 text-xs text-muted">
          <p>{hint}</p>
          {count && (
            <p className={`shrink-0 tabular-nums ${over ? "font-medium text-warning" : ""}`}>
              {count.length} / {count.recommended}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type Controlled<Element extends "input" | "textarea"> = Omit<ComponentProps<Element>, "id" | "value" | "onChange"> & {
  label: string;
  hint?: string;
  error?: string;
  recommended?: number;
  value: string;
  onChange: (value: string) => void;
};

export function TextField({ label, hint, error, recommended, value, onChange, className = "", ...props }: Controlled<"input">) {
  return (
    <Field label={label} hint={hint} error={error} count={recommended ? { length: value.length, recommended } : undefined}>
      {(field) => <input {...field} {...props} value={value} onChange={(event) => onChange(event.target.value)} className={`${control} h-9 ${className}`} />}
    </Field>
  );
}

export function TextAreaField({ label, hint, error, recommended, value, onChange, rows = 4, className = "", ...props }: Controlled<"textarea">) {
  return (
    <Field label={label} hint={hint} error={error} count={recommended ? { length: value.length, recommended } : undefined}>
      {(field) => (
        <textarea
          {...field}
          rows={rows}
          {...props}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${control} resize-y py-2 leading-relaxed ${className}`}
        />
      )}
    </Field>
  );
}

// A list of lines or paragraphs edited as one text box. Splitting and joining
// round-trip exactly, so typing is never disturbed; blank entries are dropped
// when saved.
export function LinesField({ value, onChange, separator, ...props }: Omit<Controlled<"textarea">, "value" | "onChange"> & {
  value: string[];
  onChange: (value: string[]) => void;
  separator: "\n" | "\n\n";
}) {
  return <TextAreaField {...props} value={value.join(separator)} onChange={(text) => onChange(text.split(separator))} />;
}

type SelectProps = Omit<ComponentProps<"select">, "id" | "value" | "onChange"> & {
  label: string;
  hint?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectField({ label, hint, error, options, value, onChange, className = "", ...props }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(field) => (
        <select {...field} {...props} value={value} onChange={(event) => onChange(event.target.value)} className={`${control} h-9 ${className}`}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <label
        htmlFor={id}
        className="relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full bg-border-strong transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4"
      >
        <span className="sr-only">{label}</span>
      </label>
      <div>
        <p className="text-sm font-medium" aria-hidden="true">
          {label}
        </p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

// A list of short values (stack, examples, skills) edited as removable chips
export function TagField({ label, hint, error, value, onChange }: { label: string; hint?: string; error?: string; value: string[]; onChange: (value: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function add() {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  }

  return (
    <Field label={label} hint={hint ?? "Press Enter to add."} error={error}>
      {(field) => (
        <div className={`${control} flex min-h-9 flex-wrap items-center gap-1.5 py-1.5 has-aria-invalid:border-danger`}>
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-sunken py-0.5 pr-1 pl-2 text-xs">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(value.filter((item) => item !== tag))}
                className="grid h-4 w-4 place-items-center rounded text-muted hover:bg-border hover:text-fg"
              >
                ×
              </button>
            </span>
          ))}
          <input
            {...field}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              } else if (event.key === "Backspace" && !draft && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={add}
            placeholder={value.length ? "" : "Add…"}
            className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none"
          />
        </div>
      )}
    </Field>
  );
}

// Repeatable groups (highlights, roles, services...) that can be added,
// removed and reordered. `render` draws one item and gets `update` to change it.
export function ListField<T>({
  label,
  items,
  onChange,
  empty,
  addLabel,
  error,
  render,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  addLabel: string;
  error?: string;
  render: (item: T, update: (item: T) => void, index: number) => React.ReactNode;
}) {
  // Each item keeps a stable key, so focus and scroll stay with it when moved
  const [keys, setKeys] = useState(() => items.map((_, index) => index));
  const [nextKey, setNextKey] = useState(items.length);
  // The list was replaced from outside (Discard, or a save that dropped blanks)
  if (keys.length !== items.length) {
    setKeys(items.map((_, index) => nextKey + index));
    setNextKey(nextKey + items.length);
  }

  function change(nextItems: T[], nextKeys: number[]) {
    setKeys(nextKeys);
    onChange(nextItems);
  }

  function move(index: number, by: number) {
    const reorder = <V,>(list: V[]) => {
      const next = [...list];
      next.splice(index + by, 0, ...next.splice(index, 1));
      return next;
    };
    change(reorder(items), reorder(keys));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{label}</p>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      {items.length === 0 && <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">Nothing here yet.</p>}
      {items.map((item, index) => (
        <div key={keys[index] ?? `new-${index}`} className="rounded-lg border border-border bg-sunken/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">#{index + 1}</span>
            <div className="flex gap-0.5">
              <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                ↑
              </IconButton>
              <IconButton label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                ↓
              </IconButton>
              <IconButton
                label="Remove"
                onClick={() =>
                  change(
                    items.filter((_, i) => i !== index),
                    keys.filter((_, i) => i !== index),
                  )
                }
              >
                ×
              </IconButton>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {render(item, (next) => onChange(items.map((current, i) => (i === index ? next : current))), index)}
          </div>
        </div>
      ))}
      <Button
        className="self-start"
        onClick={() => {
          change([...items, empty], [...keys, nextKey]);
          setNextKey(nextKey + 1);
        }}
      >
        + {addLabel}
      </Button>
    </div>
  );
}

// Picks a file and sends it straight to `upload` (a server action taking
// FormData with "file"), separately from the screen's Save
export function UploadButton<T>({
  label,
  accept,
  hint,
  upload,
  onUploaded,
}: {
  label: string;
  accept: string;
  hint?: string;
  upload: (formData: FormData) => Promise<SaveResult<T>>;
  onUploaded?: (value: T | undefined) => void;
}) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(file: File) {
    // Checked again on the server; this just answers big files without sending them
    if (file.size > maxUploadBytes) return setError(`That file is over ${maxUploadBytes / 1024 / 1024} MB.`);
    const formData = new FormData();
    formData.set("file", file);
    setError(null);
    startTransition(async () => {
      let result: SaveResult<T>;
      try {
        result = await upload(formData);
      } catch (error) {
        unstable_rethrow(error);
        result = { ok: false, message: "The upload didn't go through. Check your connection and try again.", errors: {} };
      }
      if (result.ok) onUploaded?.(result.value);
      else setError(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label
        htmlFor={id}
        className={`${buttonBase} ${buttonStyles.secondary} cursor-pointer has-[:disabled]:cursor-wait has-[:disabled]:opacity-60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40`}
      >
        {pending ? "Uploading…" : label}
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Lets the same file be picked again after an error
            event.target.value = "";
            if (file) send(file);
          }}
          className="sr-only"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export function IconButton({ label, children, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} {...props} className="grid h-7 w-7 place-items-center rounded-md text-sm text-muted hover:bg-border hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent">
      {children}
    </button>
  );
}

// ---- Screens ----

// Wraps an edit screen: the fields, the save bar, and the sections to jump to
export function EditForm<T>({ editor, sections, saveLabel, children }: { editor: Editor<T>; sections?: string[]; saveLabel?: string; children: React.ReactNode }) {
  // Links like /admin/projects/x#section-case-study arrive before this streamed
  // form exists, so the browser can't scroll to the section by itself
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_10rem] xl:gap-10">
      <form
        // The server checks every field and explains problems beside them
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          editor.submit();
        }}
        // Room below the last section for the save bar, which wraps to two rows on phones
        className="flex min-w-0 flex-col gap-6 pb-32 sm:pb-24"
      >
        {children}
        <SaveBar editor={editor} saveLabel={saveLabel} />
      </form>
      {sections && <SectionNav sections={sections} />}
    </div>
  );
}

// Sticky "On this page" list beside long forms, highlighting the section in view
function SectionNav({ sections }: { sections: string[] }) {
  const [current, setCurrent] = useState(sections[0]);

  useEffect(() => {
    // The current section is the last one whose top has passed a line near the
    // top of the viewport, or the last section once the page can't scroll further
    function update() {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const passed = sections.filter((title) => (document.getElementById(sectionId(title))?.getBoundingClientRect().top ?? Infinity) <= 120);
      setCurrent(atBottom ? sections[sections.length - 1] : (passed.at(-1) ?? sections[0]));
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [sections]);

  return (
    <nav aria-label="On this page" className="sticky top-10 hidden self-start xl:block">
      <p className="mb-2 text-xs font-medium text-muted">On this page</p>
      <ul className="flex flex-col border-l border-border">
        {sections.map((title) => (
          <li key={title}>
            <a
              href={`#${sectionId(title)}`}
              aria-current={current === title ? "location" : undefined}
              className={`-ml-px block border-l py-1 pl-3 text-sm transition-colors ${
                current === title ? "border-primary font-medium text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type SaveBarProps<T> = {
  editor: Editor<T>;
  // Replaces the default "Unsaved changes" text, e.g. with the selected theme
  message?: React.ReactNode;
  // Extra buttons before Discard / Save
  actions?: React.ReactNode;
  saveLabel?: string;
};

// Appears once there's something to save, and briefly confirms a save.
// Ctrl/Cmd+S saves too.
export function SaveBar<T>({ editor, message, actions, saveLabel = "Save changes" }: SaveBarProps<T>) {
  const { dirty, pending, justSaved } = editor;

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      // Not the browser's "save page" dialog
      event.preventDefault();
      editor.submit();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  if (!dirty && !pending && !justSaved) return null;

  let status: React.ReactNode;
  if (pending) status = <p className="font-medium">Saving…</p>;
  else if (justSaved) status = <p className="font-medium text-success">Saved ✓ <span className="font-normal text-muted">The live site shows it now.</span></p>;
  else if (editor.message) status = <p className="font-medium text-danger">{editor.message}</p>;
  else status = message ?? <p className="font-medium">Unsaved changes</p>;

  return (
    <div role="region" aria-label="Save changes" className="admin-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-border bg-panel/95 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur lg:left-60">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-8 lg:px-10">
        <div className="min-w-0 flex-1 basis-72 text-sm" aria-live="polite">
          {status}
        </div>
        {dirty && (
          <div className="flex flex-wrap gap-2">
            {actions}
            <Button onClick={editor.discard} disabled={pending}>
              Discard
            </Button>
            <Button variant="primary" onClick={editor.submit} disabled={pending}>
              {pending ? "Saving…" : saveLabel}
            </Button>
          </div>
        )}
      </div>
      {dirty && <LeaveGuard />}
    </div>
  );
}
