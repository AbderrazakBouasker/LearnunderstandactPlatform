"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import UpgradeForm from "./stripe-upgrade-form";
import StripeProviderWrapper from "./stripe-provider-wrapper";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanOption {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
}

interface OrganizationUpgradeStripeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: {
    name: string;
    identifier: string;
    plan: string;
  };
  username: string;
}

export function OrganizationUpgradeStripeModal({
  open,
  onOpenChange,
  organization,
  username,
}: OrganizationUpgradeStripeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"Pro" | "Enterprise" | null>(
    null
  );

  const plans: Record<string, PlanOption> = {
    Pro: {
      name: "Pro",
      price: "$10.00",
      description: "Perfect for small teams and growing businesses",
      features: [
        { name: "All Free features", included: true },
        { name: "Unlimited projects", included: true },
        { name: "Priority support", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Custom integrations", included: false },
        { name: "Dedicated account manager", included: false },
        { name: "Can embed forms on 2 domains", included: false },
      ],
    },
    Enterprise: {
      name: "Enterprise",
      price: "$50.00",
      description: "For large organizations with advanced needs",
      features: [
        { name: "All Pro features", included: true },
        { name: "Custom integrations", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "SLA guarantees", included: true },
        { name: "Custom deployment options", included: true },
        { name: "Advanced security features", included: true },
        { name: "Can embed forms on 3 domains", included: true },
      ],
    },
  };

  // Determine which plans should be shown based on current plan
  const availablePlans = () => {
    // If current plan is Pro, only show Enterprise option
    if (organization.plan === "Pro") {
      return ["Enterprise"];
    }
    // Otherwise show both upgrade options
    return ["Pro", "Enterprise"];
  };

  // Reset the selected plan when the modal is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlan(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upgrade Organization Plan</DialogTitle>
          <DialogDescription>
            Choose a plan to upgrade {organization.name} from{" "}
            {organization.plan}.
          </DialogDescription>
        </DialogHeader>

        {selectedPlan ? (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Upgrade to {selectedPlan} Plan
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlan(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Back to plans
              </Button>
            </div>
            <div className="p-4 border rounded-md">
              <StripeProviderWrapper>
                <UpgradeForm
                  identifier={organization.identifier}
                  username={username}
                  tier={selectedPlan}
                />
              </StripeProviderWrapper>
            </div>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 ${
              availablePlans().length > 1 ? "md:grid-cols-2" : ""
            } gap-4 mt-4`}
          >
            {/* Show available plan options */}
            {availablePlans().map((planName) => (
              <div
                key={planName}
                className="border rounded-md p-4 flex flex-col"
              >
                <h3 className="font-medium text-lg">{plans[planName].name}</h3>
                <p className="font-bold text-xl mt-2">
                  {plans[planName].price}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {plans[planName].description}
                </p>
                <div className="mt-4 flex-grow">
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="space-y-2">
                    {plans[planName].features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-sm gap-2"
                      >
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    setSelectedPlan(planName as "Pro" | "Enterprise")
                  }
                >
                  Select {planName}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
