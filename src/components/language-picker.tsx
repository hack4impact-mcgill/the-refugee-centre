"use client";

import { BsX } from "react-icons/bs";
import Field, { fieldClassName } from "@/components/field";
import { LANGUAGES, type Language } from "@/lib/languages";

export default function LanguagePicker({
  id,
  label,
  values,
  onChange,
}: {
  id: string;
  label: string;
  values: Language[];
  onChange: (languages: Language[]) => void;
}) {
  const remaining = LANGUAGES.filter((language) => !values.includes(language));

  return (
    <Field label={label} htmlFor={id}>
      <div className={fieldClassName}>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {values.map((language) => (
            <span
              key={language}
              className="flex items-center gap-1 rounded-full bg-sandstone-200 py-0.5 pl-2 pr-1 text-body2"
            >
              {language}
              <button
                type="button"
                aria-label={`Remove ${language}`}
                onClick={() =>
                  onChange(values.filter((current) => current !== language))
                }
                className="flex cursor-pointer items-center rounded-full text-sandstone-700 transition-colors hover:bg-sandstone-400"
              >
                <BsX aria-hidden className="size-4" />
              </button>
            </span>
          ))}
          {/* Resets to the placeholder after each pick, so it keeps reading
              "Enter languages" however many are already listed. */}
          <select
            id={id}
            value=""
            disabled={!remaining.length}
            onChange={(event) =>
              onChange([...values, event.target.value as Language])
            }
            className="min-w-32 flex-1 cursor-pointer bg-transparent text-body1 text-sandstone-500 outline-none"
          >
            <option value="" disabled>
              Enter languages
            </option>
            {remaining.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
        {values.length > 0 && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => onChange([])}
            className="flex shrink-0 cursor-pointer items-center rounded-md text-sandstone-700 transition-colors hover:bg-sandstone-300"
          >
            <BsX aria-hidden className="size-5.5" />
          </button>
        )}
      </div>
    </Field>
  );
}
