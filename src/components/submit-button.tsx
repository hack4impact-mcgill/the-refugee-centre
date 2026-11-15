"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import {
  linkButtonClassName,
  primaryButtonClassName,
} from "@/components/auth-card";

type SubmitButtonProps = Omit<ComponentProps<"button">, "type"> & {
  pendingLabel?: string;
  variant?: "primary" | "link";
};

export default function SubmitButton({
  pendingLabel,
  variant = "primary",
  disabled,
  className,
  children,
  ...props
}: SubmitButtonProps) {
  const { pending, data } = useFormStatus();
  const submittedByThis =
    pending &&
    (props.name === undefined || data?.get(props.name) === String(props.value));

  const variantClassName =
    variant === "primary" ? primaryButtonClassName : linkButtonClassName;

  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      className={
        className ? `${variantClassName} ${className}` : variantClassName
      }
    >
      {submittedByThis && pendingLabel ? pendingLabel : children}
    </button>
  );
}
