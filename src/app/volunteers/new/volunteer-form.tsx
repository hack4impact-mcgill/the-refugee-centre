"use client";

import {
  startTransition,
  useActionState,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { BsSaveFill } from "react-icons/bs";
import { Language } from "@/generated/prisma/enums";
import { toast } from "@/components/toast";
import { createVolunteer, type CreateVolunteerState } from "../actions";
import AvailabilityEditor, {
  emptyAvailability,
  toAvailabilityWindows,
} from "./availability-editor";
import MultiSelect from "@/components/multi-select";

const initialState: CreateVolunteerState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const LANGUAGE_OPTIONS = Object.values(Language)
  .sort((a, b) => a.localeCompare(b))
  .map((language) => ({ value: language, label: language }));

const inputClassName =
  "w-full max-w-90 rounded border border-sandstone-400 bg-white px-2 py-1.5 text-body2 text-navy-900 outline-none placeholder:text-sandstone-500 focus:border-navy-700 focus:ring-2 focus:ring-navy-300 aria-invalid:border-red-700";

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body2 text-navy-900">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-body2 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  error,
  ...props
}: ComponentProps<"input"> & { id: string; label: string; error?: string }) {
  return (
    <FormField id={id} label={label} error={error}>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClassName}
        {...props}
      />
    </FormField>
  );
}

export default function VolunteerForm({
  positions,
}: {
  positions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [positionIds, setPositionIds] = useState<string[]>([]);
  const [availability, setAvailability] = useState(emptyAvailability);
  const [availabilityError, setAvailabilityError] = useState<string>();

  const [state, formAction, pending] = useActionState(
    async (prevState: CreateVolunteerState, formData: FormData) => {
      const result = await createVolunteer(prevState, formData);
      if (result.status === "success") {
        toast.success(result.message);
        router.push("/volunteers");
      }
      return result;
    },
    initialState,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Submit by hand so React doesn't reset the form, keeping the entries
    // when the server rejects them.
    event.preventDefault();

    const windows = toAvailabilityWindows(availability);
    if (!windows) {
      setAvailabilityError("Enter a start and end time for each availability.");
      return;
    }
    setAvailabilityError(undefined);

    const formData = new FormData(event.currentTarget);
    for (const language of languages) formData.append("languages", language);
    for (const positionId of positionIds) {
      formData.append("positionIds", positionId);
    }
    formData.set("availability", JSON.stringify(windows));
    startTransition(() => formAction(formData));
  }

  const { fieldErrors } = state;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="volunteer-form-heading"
      className="flex flex-col"
    >
      <div className="flex items-center justify-between gap-4 border-b border-sandstone-300 px-8 py-4">
        <h2 id="volunteer-form-heading" className="truncate text-h5">
          {name.trim() || "New volunteer"}
        </h2>
        <button
          type="submit"
          disabled={pending || state.status === "success"}
          className="flex h-9.5 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg bg-navy-900 px-2.5 py-2 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:cursor-wait disabled:opacity-70"
        >
          <BsSaveFill aria-hidden className="size-5" />
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>

      <div className="flex flex-col gap-5 px-8 py-6">
        {state.status === "error" && (
          <p role="alert" className="text-body2 text-red-700">
            {state.message}
          </p>
        )}

        <TextField
          id="name"
          label="Name"
          required
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="off"
          error={fieldErrors.email}
        />
        <TextField
          id="phone"
          label="Phone Number"
          type="tel"
          autoComplete="off"
          placeholder="+1 (XXX) XXX-XXXX"
          error={fieldErrors.phone}
        />

        <FormField id="languages" label="Spoken Languages">
          <MultiSelect
            id="languages"
            label="Spoken Languages"
            placeholder="Add a language"
            options={LANGUAGE_OPTIONS}
            values={languages}
            onChange={setLanguages}
            variant="form"
          />
        </FormField>
        <FormField id="positions" label="Positions">
          <MultiSelect
            id="positions"
            label="Positions"
            placeholder={
              positions.length ? "Add a position" : "No positions yet"
            }
            options={positions.map(({ id, name }) => ({
              value: id,
              label: name,
            }))}
            values={positionIds}
            onChange={setPositionIds}
            variant="form"
          />
        </FormField>

        <AvailabilityEditor
          value={availability}
          onChange={setAvailability}
          error={availabilityError ?? fieldErrors.availability}
        />

        <FormField id="notes" label="Notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Enter a note here..."
            className={`${inputClassName} resize-y`}
          />
        </FormField>
      </div>
    </form>
  );
}
