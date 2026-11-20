"use client";

import { useState } from "react";
import type { SeriesScope } from "@/lib/schemas/shift";

const SCOPES: { scope: SeriesScope; label: string }[] = [
  { scope: "this", label: "This shift" },
  { scope: "following", label: "This and following shifts" },
  { scope: "all", label: "All shifts" },
];

/**
 * Asks which shifts of a series an edit or delete applies to. It's shown
 * inside the shift popup, since a click outside the popup closes it.
 */
export default function SeriesScopeChoice({
  title,
  confirmLabel,
  pendingLabel,
  allowThis,
  pending,
  onConfirm,
  onCancel,
}: {
  title: string;
  confirmLabel: string;
  pendingLabel: string;
  /** False when only whole-series options make sense (changing the rule) */
  allowThis: boolean;
  pending: boolean;
  onConfirm: (scope: SeriesScope) => void;
  onCancel: () => void;
}) {
  const [scope, setScope] = useState<SeriesScope>(
    allowThis ? "this" : "following",
  );

  return (
    <form
      className="flex flex-col gap-3 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm(scope);
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-subtitle1 text-navy-900">{title}</legend>
        {SCOPES.map((option) => {
          const disabled = option.scope === "this" && !allowThis;
          return (
            <label
              key={option.scope}
              className={`flex items-center gap-2 text-body2 ${
                disabled ? "text-sandstone-500" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="series-scope"
                value={option.scope}
                checked={scope === option.scope}
                disabled={disabled}
                onChange={() => setScope(option.scope)}
                className="size-4 cursor-pointer accent-navy-900 disabled:cursor-not-allowed"
              />
              {option.label}
            </label>
          );
        })}
      </fieldset>
      {!allowThis && (
        <p className="text-caption text-sandstone-700">
          Changing how a shift repeats can&apos;t apply to one shift only.
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-8 cursor-pointer rounded-lg px-3 text-body2 text-navy-700 transition-colors hover:bg-sandstone-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          autoFocus
          disabled={pending}
          className="h-8 cursor-pointer rounded-lg bg-navy-900 px-3 text-body2 text-white transition-colors hover:bg-navy-800 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </form>
  );
}
