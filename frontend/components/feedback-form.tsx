"use client";

import { useEffect, useState } from "react";
import { FeedbackFormClient } from "./feedback-form-client";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedbackForm({ formid }: { formid: string }) {
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An unknown error occurred");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
          ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/${formid}`
          : `/api/form/${formid}`;

        console.log("Fetching form data from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(data);
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
  }, [formid]);

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
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold">Form Not Found</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}
