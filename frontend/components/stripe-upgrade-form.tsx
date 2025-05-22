"use client";
import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UpgradeForm({
  identifier,
  username,
  tier,
}: {
  identifier: string;
  username: string;
  tier: "Pro" | "Enterprise";
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert tier to lowercase to match backend expectations
      const normalizedTier = tier.toLowerCase();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stripe/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username,
            identifier,
            tier: normalizedTier,
          }),
        }
      );

      // Parse the response only once and store it
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(
          responseData.error || "Failed to create payment intent"
        );
      }

      const { clientSecret } = responseData;

      if (!clientSecret) {
        throw new Error("No client secret returned from the server");
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment failed");
      } else {
        if (result.paymentIntent.status === "succeeded") {
          setSuccess(`Upgraded to ${tier} successfully!`);

          // Call backend to update organization tier using the edit endpoint
          // Send the original tier format (capitalized) as required by the API
          await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${identifier}/edit`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ plan: tier }),
            }
          );

          // Reload the page after 2 seconds to show the updated plan
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment processing failed"
      );
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md bg-muted/20">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-2">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          `Upgrade to ${tier} (${tier === "Pro" ? "10.00" : "50.00"})`
        )}
      </Button>
    </form>
  );
}
