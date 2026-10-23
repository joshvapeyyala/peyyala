"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";
import { LeaveGuard } from "./leave-guard";
import { Button, sectionId } from "./ui";

// Form controls for the admin. Until the backend exists the forms keep edits in
// the browser only: everything is editable, nothing is saved.

const control =
  "w-full rounded-lg border border-border-strong bg-panel px-3 text-sm text-fg placeholder:text-muted/70 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

type FieldProps = {
  label: string;
  hint?: string;
  // Shows "length / recommended" beside the hint, turning amber past it
  count?: { length: number; recommended: number };
  children: (id: string) => React.ReactNode;
};

export function Field({ label, hint, count, children }: FieldProps) {
  const id = useId();
  const over = count && count.length > count.recommended;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children(id)}
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

// Tracks the typed length of an uncontrolled field for its counter
function useCount(defaultValue: unknown, recommended?: number) {
  const [length, setLength] = useState(String(defaultValue ?? "").length);
  return {
    count: recommended ? { length, recommended } : undefined,
    track: (value: string) => recommended && setLength(value.length),
  };
}

type TextProps = Omit<ComponentProps<"input">, "id"> & { label: string; hint?: string; recommended?: number };

export function TextField({ label, hint, recommended, className = "", onChange, ...props }: TextProps) {
  const { count, track } = useCount(props.defaultValue, recommended);
  return (
    <Field label={label} hint={hint} count={count}>
      {(id) => (
        <input
          id={id}
          {...props}
          onChange={(event) => {
            track(event.target.value);
            onChange?.(event);
          }}
          className={`${control} h-9 ${className}`}
        />
      )}
    </Field>
  );
}

type AreaProps = Omit<ComponentProps<"textarea">, "id"> & { label: string; hint?: string; recommended?: number };

export function TextAreaField({ label, hint, recommended, rows = 4, className = "", onChange, ...props }: AreaProps) {
  const { count, track } = useCount(props.defaultValue, recommended);
  return (
    <Field label={label} hint={hint} count={count}>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          {...props}
          onChange={(event) => {
            track(event.target.value);
            onChange?.(event);
          }}
          className={`${control} resize-y py-2 leading-relaxed ${className}`}
        />
      )}
    </Field>
  );
}

type SelectProps = Omit<ComponentProps<"select">, "id"> & { label: string; hint?: string; options: { value: string; label: string }[] };

export function SelectField({ label, hint, options, className = "", ...props }: SelectProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select id={id} {...props} className={`${control} h-9 ${className}`}>
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

export function Toggle({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
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
export function TagField({ label, hint, initial }: { label: string; hint?: string; initial: string[] }) {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setDraft("");
  }

  return (
    <Field label={label} hint={hint ?? "Press Enter to add."}>
      {(id) => (
        <div className={`${control} flex min-h-9 flex-wrap items-center gap-1.5 py-1.5`}>
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-sunken py-0.5 pr-1 pl-2 text-xs">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => setTags(tags.filter((item) => item !== tag))}
                className="grid h-4 w-4 place-items-center rounded text-muted hover:bg-border hover:text-fg"
              >
                ×
              </button>
            </span>
          ))}
          <input
            id={id}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              } else if (event.key === "Backspace" && !draft && tags.length) {
                setTags(tags.slice(0, -1));
              }
            }}
            onBlur={add}
            placeholder={tags.length ? "" : "Add…"}
            className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none"
          />
        </div>
      )}
    </Field>
  );
}

// Repeatable groups (highlights, roles, services...). Each item gets a stable
// key so removing one doesn't shuffle the typed values of the others.
export function ListField<T>({
  label,
  initial,
  empty,
  addLabel,
  render,
}: {
  label: string;
  initial: T[];
  empty: T;
  addLabel: string;
  render: (item: T, index: number) => React.ReactNode;
}) {
  const [items, setItems] = useState(() => initial.map((item, index) => ({ key: index, item })));
  const [nextKey, setNextKey] = useState(initial.length);

  function move(index: number, by: number) {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + by, 0, moved);
    setItems(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{label}</p>
      {items.length === 0 && <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">Nothing here yet.</p>}
      {items.map(({ key, item }, index) => (
        <div key={key} className="rounded-lg border border-border bg-sunken/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">#{index + 1}</span>
            <div className="flex gap-0.5">
              <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>↑</IconButton>
              <IconButton label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}>↓</IconButton>
              <IconButton label="Remove" onClick={() => setItems(items.filter((entry) => entry.key !== key))}>×</IconButton>
            </div>
          </div>
          <div className="flex flex-col gap-4">{render(item, index)}</div>
        </div>
      ))}
      <Button
        className="self-start"
        onClick={() => {
          setItems([...items, { key: nextKey, item: empty }]);
          setNextKey(nextKey + 1);
        }}
      >
        + {addLabel}
      </Button>
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

// Wraps an edit screen: notices edits, shows the save bar once there are any,
// warns before leaving with unsaved changes, and lists the sections to jump to
export function EditForm({ sections, children }: { sections?: string[]; children: React.ReactNode }) {
  const [dirty, setDirty] = useState(false);
  // Discard remounts the form, resetting every field and list to the loaded content
  const [version, setVersion] = useState(0);

  // Links like /admin/projects/x#section-case-study arrive before this streamed
  // form exists, so the browser can't scroll to the section by itself
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_10rem] xl:gap-10">
      <form
        key={version}
        onChange={() => setDirty(true)}
        onClick={(event) => {
          // List add/remove/move buttons change the form without an input event,
          // but Discard doesn't
          if ((event.target as HTMLElement).closest("button:not([data-ignore-dirty])")) setDirty(true);
        }}
        onSubmit={(event) => event.preventDefault()}
        // Room below the last section for the save bar, which wraps to two rows on phones
        className="flex min-w-0 flex-col gap-6 pb-32 sm:pb-24"
      >
        {children}
        <SaveBar
          dirty={dirty}
          onDiscard={() => {
            setVersion(version + 1);
            setDirty(false);
          }}
        />
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

type SaveBarProps = {
  dirty: boolean;
  onDiscard?: () => void;
  // Replaces the default "unsaved changes" text, e.g. with the selected theme
  message?: React.ReactNode;
  // Extra buttons before Discard / Save
  actions?: React.ReactNode;
};

// Appears once there's something to save. Saving itself arrives with the backend.
export function SaveBar({ dirty, onDiscard, message, actions }: SaveBarProps) {
  const [nudged, setNudged] = useState(false);

  // Ctrl/Cmd+S would open the browser's "save page" dialog; explain instead
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setNudged(true);
        clearTimeout(timer);
        timer = setTimeout(() => setNudged(false), 3000);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, []);

  if (!dirty && !nudged) return null;

  return (
    <div role="region" aria-label="Unsaved changes" className="admin-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-border bg-panel/95 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur lg:left-60">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-8 lg:px-10">
        <div className="min-w-0 flex-1 basis-72 text-sm" aria-live="polite">
          {nudged ? (
            <p className="text-warning">Saving isn&apos;t connected yet. It arrives with the backend.</p>
          ) : (
            message ?? (
              <p>
                <span className="font-medium">Unsaved changes</span>
                <span className="text-muted"> · kept in this tab only until saving is connected</span>
              </p>
            )
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {actions}
          {onDiscard && dirty && (
            <Button data-ignore-dirty onClick={onDiscard}>
              Discard
            </Button>
          )}
          <Button variant="primary" type="submit" disabled title="Saving arrives with the backend">
            Save changes
          </Button>
        </div>
      </div>
      {dirty && <LeaveGuard />}
    </div>
  );
}
