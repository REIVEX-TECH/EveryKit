"use client";

import { AlertTriangle, Check, CircleDashed, X } from "lucide-react";
import {
  SELF_CONFIRM_ITEMS,
  type CheckStatus,
  type ComplianceCheck,
} from "@/lib/imaging/compliance";

type Props = {
  checks: ComplianceCheck[];
  confirmed: Record<string, boolean>;
  onConfirmChange: (id: string, value: boolean) => void;
};

export function ComplianceList({ checks, confirmed, onConfirmChange }: Props) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h3 className="text-[15px] font-semibold text-foreground">What this tool checked</h3>
        <ul className="mt-4 space-y-3">
          {checks.map((check) => (
            <li key={check.id} className="flex gap-3">
              <StatusIcon status={check.status} />
              <div className="min-w-0">
                <p className="text-[14px] text-foreground">{check.label}</p>
                {check.detail ? (
                  <p className="mt-0.5 text-[13px] text-text-light">{check.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-[15px] font-semibold text-foreground">What you need to confirm</h3>
        <p className="mt-1 text-[13px] text-text-light">
          We can&apos;t check these for you — the embassy can.
        </p>
        <ul className="mt-4 space-y-3">
          {SELF_CONFIRM_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={confirmed[item.id] ?? false}
                  onChange={(event) => onConfirmChange(item.id, event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-success"
                />
                <span className="text-[14px] text-foreground">{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const ICON_SIZE = 17;

function StatusIcon({ status }: { status: CheckStatus }) {
  const shared = { size: ICON_SIZE, strokeWidth: 2.2, className: "mt-0.5 shrink-0" } as const;
  switch (status) {
    case "pass":
      return (
        <span role="img" aria-label="Passed">
          <Check {...shared} className={`${shared.className} text-success`} />
        </span>
      );
    case "fail":
      return (
        <span role="img" aria-label="Failed">
          <X {...shared} className={`${shared.className} text-danger`} />
        </span>
      );
    case "warn":
      return (
        <span role="img" aria-label="Worth a look">
          <AlertTriangle {...shared} className={`${shared.className} text-warn`} />
        </span>
      );
    default:
      return (
        <span role="img" aria-label="Not checked">
          <CircleDashed {...shared} className={`${shared.className} text-line-strong`} />
        </span>
      );
  }
}
