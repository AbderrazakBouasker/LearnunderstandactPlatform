import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing Plans - LUA Platform",
  description:
    "Choose the best plan for your feedback needs with LUA Platform.",
};

interface Feature {
  name: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  priceFrequency: string;
  description: string;
  features: Feature[];
  ctaText: string;
  ctaLink: string;
  highlight?: boolean;
}

const plansData: Plan[] = [
  {
    name: "Free",
    price: "$0",
    priceFrequency: "", // Changed
    description: "Essential tools to get you started with feedback collection.",
    features: [
      { name: "Up to 3 Active Forms", included: true },
      { name: "100 Submissions/Month", included: true },
      { name: "Basic Feedback Analytics", included: true },
      { name: "Embed Forms on 1 Website", included: true },
      { name: "Community Support", included: true },
      { name: "Unlimited Forms & Submissions", included: false },
      { name: "Advanced Analytics", included: false },
      { name: "Priority Support", included: false },
      { name: "Embed Forms on up to 2 Websites", included: false }, // Changed from 3 to 2 for Pro, so Free is less
      { name: "Custom Integrations", included: false },
      { name: "Dedicated Account Manager", included: false },
      { name: "SLA Guarantees", included: false },
      { name: "Embed Forms on up to 3 Websites", included: false }, // Changed from Unlimited for Enterprise, so Free is less
    ],
    ctaText: "Get Started",
    ctaLink: "/admin/register", // Changed
  },
  {
    name: "Pro",
    price: "$10",
    priceFrequency: "", // Changed
    description: "Perfect for small teams and growing businesses.",
    features: [
      { name: "All Free features, plus:", included: true },
      { name: "Unlimited Forms & Submissions", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Priority Support", included: true },
      { name: "Embed Forms on up to 2 Websites", included: true }, // Changed
      { name: "Custom Integrations", included: false },
      { name: "Dedicated Account Manager", included: false },
      { name: "SLA Guarantees", included: false },
      { name: "Embed Forms on up to 3 Websites", included: false }, // Ensure this is false if Pro is 2
    ],
    ctaText: "Upgrade to Pro",
    ctaLink: "/admin/register", // Changed
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$50",
    priceFrequency: "", // Changed
    description: "For large organizations with advanced needs.",
    features: [
      { name: "All Pro features, plus:", included: true },
      { name: "Custom Integrations", included: true },
      { name: "Dedicated Account Manager", included: true },
      { name: "SLA Guarantees", included: true },
      { name: "Advanced Security Features", included: true },
      { name: "Custom Deployment Options", included: true },
      { name: "Embed Forms on up to 3 Websites", included: true }, // Changed
    ],
    ctaText: "Contact Sales",
    ctaLink: "/admin/register", // Changed
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-8 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Pricing Plans</h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that's right for you and start collecting valuable
            feedback today.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plansData.map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-lg p-6 flex flex-col ${
                plan.highlight
                  ? "border-purple-600 shadow-xl relative"
                  : "border-gray-200 bg-white shadow-lg"
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-3 py-1 text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500">{plan.priceFrequency}</span>
              </div>
              <p className="text-gray-600 mb-6 min-h-[40px]">
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.name.startsWith("All ") ? (
                      <Check className="h-5 w-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    ) : feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-red-400 mr-2 mt-1 flex-shrink-0" />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaLink} passHref legacyBehavior>
                <Button
                  asChild
                  size="lg"
                  className={`w-full ${
                    plan.highlight
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-slate-800 hover:bg-slate-900"
                  }`}
                >
                  <a>{plan.ctaText}</a>
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </main>
      <footer className="text-center p-8 text-gray-500 border-t mt-12 bg-white">
        <p>
          &copy; {new Date().getFullYear()} LUA Platform. All rights reserved.
        </p>
        <div className="mt-2">
          <Link href="/privacy" legacyBehavior>
            <a className="hover:underline mx-2">Privacy Policy</a>
          </Link>
          |
          <Link href="/terms" legacyBehavior>
            <a className="hover:underline mx-2">Terms of Service</a>
          </Link>
        </div>
      </footer>
    </div>
  );
}
