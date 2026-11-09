"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ARRIVE_OPTIONS,
  DEPART_OPTIONS,
  DIAS,
  LIMIT_OPTIONS,
  type Dia,
  type Limite,
} from "@/lib/planInputs";
import { formatLimit } from "@/lib/planSeat";

type Values = { llegar: string; sales: string; dia: Dia; limite: Limite };

function Field({
  label,
  value,
  onChange,
  children,
  valueClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  valueClassName: string;
}) {
  return (
    <label className="block min-w-0 rounded-xl border-2 border-[#141414] px-2 py-1.5">
      <span className="block whitespace-nowrap text-[10px] font-medium tracking-wide text-neutral-600 uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none bg-transparent font-bold outline-none ${valueClassName}`}
      >
        {children}
      </select>
    </label>
  );
}

export function PlanInputs({ children, ...initial }: Values & { children?: React.ReactNode }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function update(change: Partial<Values>) {
    const next = { ...values, ...change };
    setValues(next);
    startTransition(() => {
      const params = new URLSearchParams({ ...next, limite: String(next.limite) });
      router.replace(`/?${params}`, { scroll: false });
    });
  }

  return (
    <div aria-busy={isPending} className={isPending ? "opacity-60" : ""}>
      <div className="mt-5 grid grid-cols-[1fr_1fr_1.2fr] gap-2">
        <Field
          label="Llegar"
          value={values.llegar}
          onChange={(llegar) => update({ llegar })}
          valueClassName="text-xl"
        >
          {ARRIVE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Field>
        <Field
          label="En la parada"
          value={values.sales}
          onChange={(sales) => update({ sales })}
          valueClassName="text-xl"
        >
          {DEPART_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Field>
        <Field
          label="Día"
          value={values.dia}
          onChange={(dia) => update({ dia: dia as Dia })}
          valueClassName="text-lg leading-7"
        >
          {DIAS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Field>
      </div>
      {children}
      <fieldset className="mt-4">
        <legend className="text-lg font-bold leading-snug">
          ¿Cuánto antes podrías estar en la parada sin que te cueste?
        </legend>
        {/* 360px fits all five in one row only at 14px; each stays a 44px tap target. */}
        <div className="mt-2 flex gap-1">
          {LIMIT_OPTIONS.map((limite) => {
            const selected = values.limite === limite;
            return (
              <button
                key={limite}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ limite })}
                className={`min-h-11 min-w-11 flex-auto rounded-full border-2 border-[#141414] px-1 text-sm font-bold whitespace-nowrap ${
                  selected ? "bg-[#141414] text-white" : "bg-white text-[#141414]"
                }`}
              >
                {limite === 0 ? "No puedo" : formatLimit(limite)}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
