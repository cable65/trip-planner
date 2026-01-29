import { DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type CostSummaryProps = {
  estimatedTotal: number;
  budget?: number | null;
  currency?: string;
  locale?: string;
};

export function CostSummary({ estimatedTotal, budget, currency, locale }: CostSummaryProps) {
  const code = currency || "USD";
  const loc = locale || "en-US";

  if (!budget) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="mb-2 font-semibold text-neutral-100">Estimated Cost</h3>
        <div className="text-2xl font-bold text-white">{formatCurrency({ amount: estimatedTotal, currency: code, locale: loc })}</div>
        <p className="mt-1 text-sm text-neutral-400">Total estimated from itinerary activities.</p>
      </div>
    );
  }

  const isOverBudget = estimatedTotal > budget;
  const percentUsed = Math.min(100, Math.round((estimatedTotal / budget) * 100));

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-neutral-100">Budget Overview</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{formatCurrency({ amount: estimatedTotal, currency: code, locale: loc })}</span>
            <span className="text-sm text-neutral-400">{`of ${formatCurrency({ amount: budget, currency: code, locale: loc })}`}</span>
          </div>
        </div>
        {isOverBudget ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertCircle className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs font-medium text-neutral-400">
          <span>{percentUsed}% used</span>
          <span>{isOverBudget ? "Over budget" : "Within budget"}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className={`h-full rounded-full transition-all ${
              isOverBudget ? "bg-red-500" : "bg-indigo-500"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  );
}
