"use client";

import { BsX, BsXCircleFill } from "react-icons/bs";

export type MultiSelectOption<T extends string> = { value: T; label: string };

const styles = {
  box: "flex w-full items-start gap-2 rounded border border-sandstone-400 bg-white px-2 py-1.5 focus-within:border-navy-700 focus-within:ring-2 focus-within:ring-navy-300",
  chips: "min-h-6 gap-1.5",
  chip: "gap-1 rounded-full border border-navy-500 bg-navy-300 py-0.5 pr-1 pl-2 text-caption leading-4 tracking-normal text-navy-900",
  remove: "rounded-full text-navy-600 transition-colors hover:text-navy-800",
  removeIcon: "size-3",
  select: "min-w-28 text-body2 text-sandstone-600",
  clear:
    "size-6 justify-center rounded text-navy-900 transition-colors hover:bg-sandstone-200",
  clearIcon: "size-5",
};

/** `id` goes on the select, so a `<label htmlFor={id}>` outside labels it. */
export default function MultiSelect<T extends string>({
  id,
  label,
  placeholder,
  options,
  values,
  onChange,
}: {
  id: string;
  /** What is being picked, for the remove and clear buttons' labels. */
  label: string;
  placeholder: string;
  options: MultiSelectOption<T>[];
  values: T[];
  onChange: (values: T[]) => void;
}) {
  const selected = values
    .map((value) => options.find((option) => option.value === value))
    .filter((option) => option !== undefined);
  const remaining = options.filter((option) => !values.includes(option.value));

  return (
    <div className={styles.box}>
      <div className={`flex flex-1 flex-wrap items-center ${styles.chips}`}>
        {selected.map((option) => (
          <span
            key={option.value}
            className={`flex items-center ${styles.chip}`}
          >
            {option.label}
            <button
              type="button"
              aria-label={`Remove ${option.label}`}
              onClick={() =>
                onChange(values.filter((value) => value !== option.value))
              }
              className={`flex cursor-pointer items-center ${styles.remove}`}
            >
              <BsXCircleFill aria-hidden className={styles.removeIcon} />
            </button>
          </span>
        ))}
        {/* Pinned to "" so it shows the placeholder again after each pick. */}
        <select
          id={id}
          value=""
          disabled={!remaining.length}
          onChange={(event) => onChange([...values, event.target.value as T])}
          className={`flex-1 cursor-pointer bg-transparent outline-none disabled:cursor-default ${styles.select}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {remaining.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {values.length > 0 && (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => onChange([])}
          className={`flex shrink-0 cursor-pointer items-center ${styles.clear}`}
        >
          <BsX aria-hidden className={styles.clearIcon} />
        </button>
      )}
    </div>
  );
}
