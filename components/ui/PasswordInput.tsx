"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "input", style, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div style={{ position: "relative", width: "100%" }}>
        <input
          {...props}
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={className}
          style={{ paddingRight: "40px", ...style }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          title={showPassword ? "Ocultar senha" : "Ver senha"}
          aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            borderRadius: "4px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
