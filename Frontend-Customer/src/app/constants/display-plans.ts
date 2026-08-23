/** Fixed USD display plans — keep in sync with Backend/Services/PricingService.cs */
export interface DisplayPlan {
  days: number;
  price: number;
  label: string;
}

export const MEMORA_DISPLAY_PLANS: DisplayPlan[] = [
  { days: 30, price: 200, label: '1 Month' },
  { days: 90, price: 350, label: '3 Months' },
  { days: 180, price: 500, label: '6 Months' },
  { days: 365, price: 750, label: '12 Months' }
];

export function periodLabelForDays(days: number): string {
  const plan = MEMORA_DISPLAY_PLANS.find((p) => p.days === days);
  return plan?.label ?? `${days} days`;
}

/** Safe for Angular templates (avoid "${{" which breaks the compiler). */
export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}
