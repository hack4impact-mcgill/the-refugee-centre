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
import MultiSelect from "@/components/multi-select";
import type { VolunteerRecord } from "@/lib/volunteers";
import {
  createVolunteer,
  updateVolunteer,
  type VolunteerFormState,
} from "./actions";
import AvailabilityEditor, {
  fromAvailabilityWindows,
  toAvailabilityWindows,
} from "./availability-editor";
import { headerActionClassName, nameBarClassName } from "./styles";

const initialState: VolunteerFormState = {
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

/**
 * The add-volunteer form, or with `volunteer`, the edit form for that
 * volunteer, filled in with their current details.
 */
export default function VolunteerForm({
  positions,
  volunteer,
}: {
  positions: { id: string; name: string }[];
  volunteer?: VolunteerRecord;
}) {
  const router = useRouter();
  const [name, setName] = useState(volunteer?.name ?? "");
  const [languages, setLanguages] = useState<Language[]>(
    volunteer?.languages ?? [],
  );
  const [positionIds, setPositionIds] = useState<string[]>(
    volunteer?.positions.map(({ id }) => id) ?? [],
  );
  const [availability, setAvailability] = useState(() =>
    fromAvailabilityWindows(volunteer?.availability ?? []),
  );
  const [availabilityError, setAvailabilityError] = useState<string>();

  const [state, formAction, pending] = useActionState(
    async (prevState: VolunteerFormState, formData: FormData) => {
      const result = volunteer
        ? await updateVolunteer(volunteer.id, prevState, formData)
        : await createVolunteer(prevState, formData);
      if (result.status === "success") {
        toast.success(result.message);
        router.push(volunteer ? `/volunteers/${volunteer.id}` : "/volunteers");
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
      <div className={nameBarClassName}>
        <h2 id="volunteer-form-heading" className="truncate text-h5">
          {name.trim() || (volunteer ? "Unnamed volunteer" : "New volunteer")}
        </h2>
        <button
          type="submit"
          disabled={pending || state.status === "success"}
          className={headerActionClassName}
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
          defaultValue={volunteer?.email ?? ""}
          error={fieldErrors.email}
        />
        <TextField
          id="phone"
          label="Phone Number"
          type="tel"
          autoComplete="off"
          placeholder="+1 (XXX) XXX-XXXX"
          defaultValue={volunteer?.phone ?? ""}
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
            defaultValue={volunteer?.notes ?? ""}
            className={`${inputClassName} resize-y`}
          />
        </FormField>
      </div>
    </form>
  );
}
