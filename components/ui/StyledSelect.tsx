"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type StyledSelectProps = {
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
};

export function StyledSelect({ label, value, options, onChange, className = "" }: StyledSelectProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div
      className={`styled-select ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {label ? <span className="styled-select-label">{label}</span> : null}
      <button
        id={id}
        type="button"
        className="interactive-control styled-select-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{value || options[0]}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="styled-select-menu" role="listbox" aria-labelledby={id}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              className={option === value ? "is-selected" : ""}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
