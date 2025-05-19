'use client'
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DriveUploadMethod } from "@/components/creator-dashboard/components/drive-upload";
import { getStoragePlan } from "@/app/action";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plan, UpgradePlan, BillingCycle } from "@/types/storage-plan";
import {PayHalalService} from '@/services/payhalal.service';

const plans: Plan[] = [
  { type: "Free", total: 5*1024, used: 0 },
  { type: "Personal", total: 200*1024, used: 0 },
  { type: "Enterprise", total: Infinity, used: 0 },
];

const upgradePlans: UpgradePlan[] = [
  { type: "Personal", price: { monthly: 10, yearly: 100 }, total: 200*1024 },
  { type: "Enterprise", price: { monthly: 100, yearly: 1000 }, total: Infinity },
];

export default function StoragePage(): JSX.Element {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan>(plans[0]);
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const totalStorage = currentPlan.total === Infinity ? 0 : currentPlan.total;
  const usedPercent = totalStorage ? (currentPlan.used / totalStorage) * 100 : 100;

  const {data: session} = useSession();
  console.log(">>> Current Plan", currentPlan)

  const setCurrentStoragePlan = async () => {
    try {
      const storagePlan = await getStoragePlan();
      setCurrentPlan(storagePlan as Plan);
    } catch (error: any) {
      console.error(error.message);
    }
  }

  const onRequestPayment = async () => {
    try {
      window.location.href = await PayHalalService.initiateTestStoragePayment({
        userId: session?.user?.id,
        userEmail: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        selectedPlan,
        price: upgradePlans.find(plan => plan.type === selectedPlan)?.price[billingCycle] ?? 0,
        billingCycle
      });
    } catch (error) {
        console.error('Payment initialization failed:', error);
    }
  };

  const onUploadSuccess = () => {
    setCurrentStoragePlan();
  }

  useEffect(() => {
    setCurrentStoragePlan()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <DriveUploadMethod currentPlan={currentPlan} onSuccess={onUploadSuccess} />
      <h1 className="text-3xl font-bold mb-6">Storage Plan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => (
          <Card
            key={plan.type}
            className={`p-4 border-2 transition-all ${
              plan.type === currentPlan.type ? "border-primary bg-muted" : "border-muted"
            }`}
          >
            <div className="font-bold text-lg mb-1">{plan.type}</div>
            <div className="text-sm">Storage: {plan.total === Infinity ? "Unlimited" : `${plan.total/1024}GB`}</div>
            <div className="text-sm">Used: {Number(currentPlan.used/1024).toFixed(4)}GB</div>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="text-lg font-semibold mb-2">Current Plan: {currentPlan.type}</div>
          <div className="mb-4 text-sm text-muted-foreground">
            Used Storage: {Number(currentPlan.used/1024).toFixed(4)}GB / {currentPlan.total === Infinity ? "Unlimited" : `${currentPlan.total/1024}GB`}
          </div>
          <Progress value={usedPercent} className="mb-4" />

          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Upgrade Plan</Button>
              </DialogTrigger>
              <DialogTitle></DialogTitle>
              <DialogContent>
                <div className="flex items-center justify-between mb-4 mt-4">
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
                      key={plan.type}
                      onClick={() => setSelectedPlan(plan.type)}
                      className={`cursor-pointer p-4 border-2 transition-all ${
                        selectedPlan === plan.type ? "border-primary" : "border-muted"
                      }`}
                    >
                      <div className="font-bold text-lg mb-2">{plan.type}</div>
                      <div className="text-sm mb-1">{plan.total / 1024}</div>
                      <div className="text-sm">
                        RM{plan.price[billingCycle]}/{billingCycle}
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="name" className="block mb-1 text-sm font-medium">
                      Full Name
                    </Label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Ali Ahmad"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="block mb-1 text-sm font-medium">
                      Phone Number
                    </Label>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="60123456789"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="block mb-1 text-sm font-medium">
                      Email Address
                    </Label>
                    <input
                      type="email"
                      id="email"
                      placeholder="your@email.com"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black"
                    />
                  </div>
                  <Button className="w-full" onClick={onRequestPayment}>Submit</Button>
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
