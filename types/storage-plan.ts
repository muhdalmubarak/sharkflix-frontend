export type Plan = {
  type: string;
  total: number;
  used: number;
};
  
export type BillingCycle = "monthly" | "yearly";

export type UpgradePlan = {
  type: string;
  price: Record<BillingCycle, number>;
  total: number;
};