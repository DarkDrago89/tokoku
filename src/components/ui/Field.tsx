import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-50";

type FieldProps = { label?: string; hint?: string; error?: string; required?: boolean; className?: string };

function Wrapper({
  label,
  hint,
  error,
  required,
  className,
  id,
  children,
}: FieldProps & { id?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-800">
          {label}
          {required && <span className="ml-0.5 text-zinc-400">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? props.name;
  return (
    <Wrapper {...{ label, hint, error, required, className, id }}>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        className={cn(control, "h-11", error && "border-red-400")}
        {...props}
      />
    </Wrapper>
  );
}

export function Textarea({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = props.id ?? props.name;
  return (
    <Wrapper {...{ label, hint, error, required, className, id }}>
      <textarea
        id={id}
        required={required}
        rows={3}
        className={cn(control, "py-2.5", error && "border-red-400")}
        {...props}
      />
    </Wrapper>
  );
}

export function Select({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: FieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = props.id ?? props.name;
  return (
    <Wrapper {...{ label, hint, error, required, className, id }}>
      <div className="relative">
        <select id={id} required={required} className={cn(control, "h-11 appearance-none pr-9")} {...props}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
    </Wrapper>
  );
}
