import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface FormField {
  label: string;
  type: string;
  value?: string;
  _id: string;
}

interface FormData {
  _id: string;
  title: string;
  description: string;
  opinion: string[];
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export function FormDetailModal({ formId }: { formId: string }) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define which top-level fields to display
  const mainFieldsToDisplay = ["title", "description", "createdAt"];

  // Fields to skip from direct display
  const skipFields = ["fields", "_id", "__v", "opinion", "updatedAt"];

  // Add emoji mapping for opinion values
  const opinionEmojis: Record<string, string> = {
    "very dissatisfied": "😠",
    dissatisfied: "🙁",
    "somewhat dissatisfied": "😕",
    neutral: "😐",
    "somewhat satisfied": "🙂",
    satisfied: "😊",
    "very satisfied": "😄",
  };

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/${formId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch form data");
        }

        const data = await response.json();
        setFormData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (formId) {
      fetchFormData();
    }
  }, [formId]);

  if (isLoading) {
    return (
      <DialogContent className="sm:max-w-[600px]">
        <p className="text-center py-8">Loading form details...</p>
      </DialogContent>
    );
  }

  if (error || !formData) {
    return (
      <DialogContent className="sm:max-w-[600px]">
        <p className="text-center text-red-500 py-8">
          {error || "Could not load form details"}
        </p>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Form Details</DialogTitle>
        <DialogDescription>
          Details for form: {formData.title}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
        {/* Display main form information */}
        {mainFieldsToDisplay.map((key) =>
          formData[key as keyof FormData] ? (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={key} className="text-right capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <div className="col-span-3 break-words">
                <Textarea
                  id={key}
                  value={formData[key as keyof FormData]?.toString() || ""}
                  className="resize-none w-full"
                  disabled
                  rows={
                    formData[key as keyof FormData]?.toString().length > 100
                      ? 3
                      : 1
                  }
                />
              </div>
            </div>
          ) : null
        )}

        {/* Display opinion options with emojis */}
        {formData.opinion && formData.opinion.length > 0 && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="opinion" className="text-right capitalize">
              Opinion Options
            </Label>
            <div className="col-span-3">
              <div className="border rounded-md p-4 bg-muted/20 flex justify-between items-center">
                {formData.opinion.map((option, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-3xl" title={option}>
                      {opinionEmojis[option.toLowerCase()] || option}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Display form fields */}
        <div className="border-t pt-4 mt-2">
          <h3 className="font-medium mb-3">Form Fields</h3>
          {formData.fields && formData.fields.length > 0 ? (
            formData.fields.map((field) => (
              <div
                key={field._id}
                className="grid grid-cols-4 items-center gap-4 mb-2"
              >
                <Label htmlFor={field._id} className="text-right capitalize">
                  {field.label} ({field.type})
                </Label>
                <div className="col-span-3 break-words">
                  <Textarea
                    id={field._id}
                    value={field.value || "No default value"}
                    className="resize-none w-full"
                    disabled
                    rows={(field.value?.length || 0) > 100 ? 3 : 1}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              No fields defined for this form
            </p>
          )}
        </div>

        {/* Display any other fields we didn't explicitly handle */}
        {Object.entries(formData)
          .filter(
            ([key, value]) =>
              !skipFields.includes(key) &&
              !mainFieldsToDisplay.includes(key) &&
              typeof value !== "function" &&
              !Array.isArray(value) &&
              (typeof value !== "object" || value === null)
          )
          .map(([key, value]) => (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={key} className="text-right capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <div className="col-span-3 break-words">
                <Textarea
                  id={key}
                  value={value?.toString() || ""}
                  className="resize-none w-full"
                  disabled
                  rows={value?.toString().length > 100 ? 3 : 1}
                />
              </div>
            </div>
          ))}
      </div>
    </DialogContent>
  );
}
