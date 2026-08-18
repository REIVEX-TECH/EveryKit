"use client";

import { useId } from "react";
import type { Field, Tone, Values } from "@/lib/letter/types";

type Props = {
  fields: Field[];
  values: Values;
  onChange: (id: string, value: string) => void;
  toneVariants: Tone[] | null;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
};

/**
 * The form, grouped the way someone fills it in rather than the way the data
 * is shaped. Help text is written for a person who has never sent a formal
 * letter, because that is who reaches for this.
 */
export function LetterForm({
  fields,
  values,
  onChange,
  toneVariants,
  tone,
  onToneChange,
}: Props) {
  const groups: Array<{ name: string; fields: Field[] }> = [];
  for (const field of fields) {
    const name = field.group ?? "Details";
    const existing = groups.find((group) => group.name === name);
    if (existing) existing.fields.push(field);
    else groups.push({ name, fields: [field] });
  }

  return (
    <div className="space-y-8">
      {toneVariants ? (
        <fieldset>
          <legend className="text-[14px] font-semibold text-foreground">Tone</legend>
          <p className="mt-1 text-[13px] text-text-light">
            Firm is still professional. It states a date and what happens after
            it, rather than raising its voice.
          </p>
          <div className="mt-3 inline-flex rounded-full border border-line p-1">
            {toneVariants.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={tone === option}
                onClick={() => onToneChange(option)}
                className={`rounded-full px-4 py-1.5 text-[14px] font-semibold ${
                  tone === option ? "bg-foreground text-white" : "text-text-light"
                }`}
              >
                {option === "polite" ? "Polite" : "Firm"}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {groups.map((group) => (
        <fieldset key={group.name}>
          <legend className="text-[14px] font-semibold text-foreground">{group.name}</legend>
          <div className="mt-3 space-y-4">
            {group.fields.map((field) => (
              <FormField
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={(value) => onChange(field.id, value)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function FormField({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const shared =
    "mt-1 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary";

  if (field.type === "checkbox") {
    return (
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(event) => onChange(event.target.checked ? "true" : "")}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        />
        <span>
          <span className="text-[14px] text-foreground">{field.label}</span>
          {field.help ? (
            <span className="block text-[13px] text-text-light">{field.help}</span>
          ) : null}
        </span>
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="text-[14px] text-foreground">
        {field.label}
        {field.required ? null : (
          <span className="text-text-light"> — optional</span>
        )}
      </label>
      {field.help ? (
        <p id={helpId} className="text-[13px] text-text-light">
          {field.help}
        </p>
      ) : null}

      {field.type === "textarea" ? (
        <textarea
          id={id}
          rows={field.rows ?? 3}
          value={value}
          placeholder={field.placeholder}
          aria-describedby={field.help ? helpId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          value={value}
          aria-describedby={field.help ? helpId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        >
          <option value="">Choose one</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          value={value}
          placeholder={field.placeholder}
          aria-describedby={field.help ? helpId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      )}
    </div>
  );
}
