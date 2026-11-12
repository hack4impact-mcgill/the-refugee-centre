"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { Toaster as SonnerToaster, toast as sonner } from "sonner";
import {
  BsCheckCircleFill,
  BsFillExclamationCircleFill,
  BsInfoCircleFill,
  BsXCircleFill,
} from "react-icons/bs";

const VARIANTS = {
  success: {
    Icon: BsCheckCircleFill,
    box: "border-green-700 bg-green-100",
    accent: "text-green-700",
    bar: "bg-green-700",
  },
  error: {
    Icon: BsXCircleFill,
    box: "border-red-700 bg-red-200",
    accent: "text-red-700",
    bar: "bg-red-700",
  },
  warning: {
    Icon: BsFillExclamationCircleFill,
    box: "border-yellow-700 bg-yellow-200",
    accent: "text-yellow-700",
    bar: "bg-yellow-700",
  },
  info: {
    Icon: BsInfoCircleFill,
    box: "border-navy-700 bg-navy-200",
    accent: "text-navy-700",
    bar: "bg-navy-700",
  },
};

type ToastVariant = keyof typeof VARIANTS;

type ToastOptions = {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

const DURATION = 4000;
const ACTION_DURATION = 6000;

const smallTextClassName = "text-[11px] leading-[13px] tracking-[-0.066px]";

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

type ToastProps = ToastOptions & {
  id: string | number;
  variant: ToastVariant;
  title: string;
  duration: number;
};

function Toast({
  id,
  variant,
  title,
  description,
  action,
  duration,
}: ToastProps) {
  const { Icon, box, accent, bar } = VARIANTS[variant];
  const documentHidden = useSyncExternalStore(
    subscribeToVisibility,
    () => document.hidden,
    () => false,
  );

  return (
    <div
      className={`flex w-(--width) flex-col overflow-clip rounded-lg border font-sans shadow-[-4px_4px_20px_0_rgba(0,0,0,0.05)] ${box}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon aria-hidden className={`size-6 shrink-0 ${accent}`} />
          <div className="flex min-w-0 flex-col gap-0.5 text-sandstone-900">
            <p className="text-body1">{title}</p>
            {description && (
              <p className={`truncate ${smallTextClassName}`}>{description}</p>
            )}
          </div>
        </div>
        {action && (
          <button
            type="button"
            onClick={() => {
              sonner.dismiss(id);
              action.onClick();
            }}
            className={`shrink-0 cursor-pointer rounded px-1 py-0.5 text-sandstone-600 transition-colors hover:bg-black/5 hover:text-sandstone-900 ${smallTextClassName}`}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Pauses whenever Sonner pauses its timer: on hover and while the tab is hidden. */}
      <div
        aria-hidden
        style={{ animationDuration: `${duration}ms` }}
        className={`h-2 origin-left animate-toast-countdown in-data-[expanded=true]:[animation-play-state:paused] ${
          documentHidden ? "[animation-play-state:paused]" : ""
        } ${bar}`}
      />
    </div>
  );
}

function show(
  variant: ToastVariant,
  title: string,
  options: ToastOptions = {},
) {
  const duration =
    options.duration ?? (options.action ? ACTION_DURATION : DURATION);
  return sonner.custom(
    (id) => (
      <Toast
        {...options}
        id={id}
        variant={variant}
        title={title}
        duration={duration}
      />
    ),
    { duration },
  );
}

export const toast = {
  success: (title: string, options?: ToastOptions) =>
    show("success", title, options),
  error: (title: string, options?: ToastOptions) =>
    show("error", title, options),
  warning: (title: string, options?: ToastOptions) =>
    show("warning", title, options),
  info: (title: string, options?: ToastOptions) => show("info", title, options),
  dismiss: sonner.dismiss,
};

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      style={{ "--width": "300px" } as CSSProperties}
    />
  );
}
