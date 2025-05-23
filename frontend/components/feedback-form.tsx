"use client";

import { useEffect, useState } from "react";
import { FeedbackFormClient } from "./feedback-form-client";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedbackForm({
  formid,
  isEmbedded,
}: {
  formid: string;
  isEmbedded: boolean;
}) {
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An unknown error occurred");
  const [loading, setLoading] = useState(true);
  const [isDomainAllowed, setIsDomainAllowed] = useState(true); // New state for domain check

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
          ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/${formid}`
          : `/api/form/${formid}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(data);

          if (isEmbedded) {
            const organizationDomains = data.organizationDomains as
              | string[]
              | undefined;

            // Default to not allowed for embedded forms
            let currentDomainAllowed = false;
            if (organizationDomains && organizationDomains.length > 0) {
              const currentHostname = window.location.hostname;
              if (organizationDomains.includes(currentHostname)) {
                currentDomainAllowed = true;
              }
            }
            // If organizationDomains is empty or undefined, currentDomainAllowed remains false.

            if (!currentDomainAllowed) {
              setIsDomainAllowed(false);
              setErrorMessage(
                "This form cannot be embedded on the current domain. Please contact the form owner for assistance."
              );
              setError(true);
            } else {
              setIsDomainAllowed(true); // Explicitly set to true if allowed
            }
          }
        } else {
          setError(true);
          setErrorMessage(
            `Server returned ${response.status}: ${response.statusText}`
          );
        }
      } catch (e) {
        setError(true);
        setErrorMessage(
          e instanceof Error ? e.message : "Failed to fetch form data"
        );
        console.error("Error fetching form:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formid, isEmbedded]);

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-10 w-1/3" />
        </div>
      </div>
    );
  }

  // If domain is not allowed, show specific message
  if (!isDomainAllowed) {
    return (
      // Adjusted container for better display in various contexts, including dialogs
      <div className="flex w-full flex-col items-center justify-center p-6 text-center md:p-10">
        <h1 className="text-2xl font-bold">Embedding Not Allowed</h1>
        <p className="text-muted-foreground mt-2">{errorMessage}</p>
      </div>
    );
  }

  return (
    <>
      {!error && formData ? (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold">
              {formData.title || "Feedback Form"}
            </h1>
            <p className="text-muted-foreground">
              {formData.description ||
                "Please fill out the form below to provide your feedback."}
            </p>

            <FeedbackFormClient formData={formData} formId={formid} />
          </div>
        </div>
      ) : (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm text-center">
            <h1 className="text-2xl font-bold">
              {isDomainAllowed ? "Form Not Found" : "Embedding Not Allowed"}
            </h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}
