"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ARRIVE_OPTIONS, DEPART_OPTIONS, DIAS, type Dia } from "@/lib/planInputs";

type Values = { llegar: string; sales: string; dia: Dia };

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

export function PlanInputs(initial: Values) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function update(change: Partial<Values>) {
    const next = { ...values, ...change };
    setValues(next);
    startTransition(() => {
      router.replace(`/?${new URLSearchParams(next)}`, { scroll: false });
    });
  }

  return (
    <div
      aria-busy={isPending}
      className={`mt-5 grid grid-cols-[1fr_1fr_1.2fr] gap-2 ${isPending ? "opacity-60" : ""}`}
    >
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
        label="Sueles salir"
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
  );
}
