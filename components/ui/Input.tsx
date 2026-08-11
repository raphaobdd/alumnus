import * as React from "react";
import { cn } from "./cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "input",
            error && "border-[var(--danger)] focus:ring-[var(--danger)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
