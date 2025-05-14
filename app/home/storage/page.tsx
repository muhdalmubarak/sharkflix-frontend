'use client'
import { DriveUploadMethod } from "@/components/creator-dashboard/components/drive-upload";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Plan = {
  name: string;
  storage: string;
  used: number;
};

type BillingCycle = "monthly" | "yearly";

type UpgradePlan = {
  name: string;
  price: Record<BillingCycle, number>;
  storage: string;
};

const plans: Plan[] = [
  { name: "Free", storage: "5GB", used: 3 },
  { name: "Personal", storage: "200GB", used: 120 },
  { name: "Enterprise", storage: "Unlimited", used: 520 },
];

const upgradePlans: UpgradePlan[] = [
  { name: "Personal", price: { monthly: 10, yearly: 100 }, storage: "200GB" },
  { name: "Enterprise", price: { monthly: 100, yearly: 1000 }, storage: "Unlimited" },
];

export default function StoragePage(): JSX.Element {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentPlan = plans[1]; // Personal

  const totalStorage = currentPlan.storage === "Unlimited" ? 0 : parseInt(currentPlan.storage);
  const usedPercent = totalStorage ? (currentPlan.used / totalStorage) * 100 : 100;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Storage Plan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-4 border-2 transition-all ${
              plan.name === currentPlan.name ? "border-primary bg-muted" : "border-muted"
            }`}
          >
            <div className="font-bold text-lg mb-1">{plan.name}</div>
            <div className="text-sm">Storage: {plan.storage}</div>
            <div className="text-sm">Used: {plan.used}GB</div>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="text-lg font-semibold mb-2">Current Plan: {currentPlan.name}</div>
          <div className="mb-4 text-sm text-muted-foreground">
            Used Storage: {currentPlan.used}GB / {currentPlan.storage}
          </div>
          <Progress value={usedPercent} className="mb-4" />

          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Upgrade Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="billing">Billing:</Label>
                  <div className="flex items-center gap-2">
                    <span>Monthly</span>
                    <Switch
                      id="billing"
                      checked={billingCycle === "yearly"}
                      onCheckedChange={() =>
                        setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
                      }
                    />
                    <span>Yearly</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upgradePlans.map((plan) => (
                    <Card
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`cursor-pointer p-4 border-2 transition-all ${
                        selectedPlan === plan.name ? "border-primary" : "border-muted"
                      }`}
                    >
                      <div className="font-bold text-lg mb-2">{plan.name}</div>
                      <div className="text-sm mb-1">{plan.storage}</div>
                      <div className="text-sm">
                        RM{plan.price[billingCycle]}/{billingCycle}
                      </div>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline">View History</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
