"use client";
import React, { useEffect } from "react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal, X } from "lucide-react";

export function FeedbackFormClient({
  formData,
  formId,
}: {
  formData: {
    title: string;
    description: string;
    opinion?: string[];
    fields: Array<{
      _id: string;
      type: string;
      label: string;
      value?: string | Array<string>;
    }>;
  };
  formId: string;
}) {
  // Add emoji mapping for opinion options
  const opinionEmojis: Record<string, string> = {
    "very dissatisfied": "😠",
    dissatisfied: "🙁",
    "somewhat dissatisfied": "😕",
    neutral: "😐",
    "somewhat satisfied": "🙂",
    satisfied: "😊",
    "very satisfied": "😄",
  };

  const [isAlert, setIsAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertVariant, setAlertVariant] = useState<"default" | "destructive">(
    "default"
  );

  // Add useEffect to automatically dismiss alerts
  useEffect(() => {
    if (isAlert) {
      const timer = setTimeout(() => {
        setIsAlert(false);
      }, 3000);

      // Clean up the timer if component unmounts or isAlert changes
      return () => clearTimeout(timer);
    }
  }, [isAlert]);

  // Make sure radio fields are initialized with empty string - just like opinion
  const initialState = {
    opinion: "",
    ...formData.fields.reduce((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.label] = [];
      } else if (field.type === "radio") {
        // Explicitly set radio fields to empty string, just like opinion
        acc[field.label] = "";
      } else if (field.type === "color") {
        acc[field.label] = field.value || "#000000";
      } else {
        acc[field.label] = field.value || "";
      }
      return acc;
    }, {} as Record<string, any>),
  };

  const [formState, setFormState] = useState(initialState);

  console.log("Current form state:", formState);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, boolean>
  >({});

  const handleInputChange = (fieldLabel: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [fieldLabel]: value,
    }));

    // Clear validation error when value is selected
    if (validationErrors[fieldLabel]) {
      setValidationErrors((prev) => ({ ...prev, [fieldLabel]: false }));
    }
  };

  const handleCheckboxChange = (
    fieldLabel: string,
    value: string,
    checked: boolean
  ) => {
    setFormState((prev) => {
      const currentValues = prev[fieldLabel] || [];
      let newValues;

      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((v: string) => v !== value);
      }

      // Clear validation error if at least one checkbox is checked
      if (validationErrors[fieldLabel] && newValues.length > 0) {
        setValidationErrors((prev) => ({ ...prev, [fieldLabel]: false }));
      }

      return {
        ...prev,
        [fieldLabel]: newValues,
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: Record<string, boolean> = {};

    // Validate opinion if it exists
    if (formData.opinion && formData.opinion.length > 0 && !formState.opinion) {
      errors.opinion = true;
    }

    // Log state and fields to debug
    console.log("Form state at validation:", formState);
    console.log("Fields for validation:", formData.fields);

    // Very simple validation for radio fields matching opinion exactly
    formData.fields.forEach((field) => {
      if (field.type === "radio") {
        console.log(
          `Checking radio field: ${field.label}, value: ${
            formState[field.label]
          }`
        );
        if (!formState[field.label]) {
          errors[field.label] = true;
        }
      }

      // For checkbox fields
      if (
        field.type === "checkbox" &&
        Array.isArray(formState[field.label]) &&
        formState[field.label].length === 0
      ) {
        errors[field.label] = true;
      }
    });

    console.log("Validation errors:", errors);

    // If there are validation errors, stop submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/feedback/${formId}`
        : `/api/feedback/${formId}`;

      // Transform the form state to the required format
      const submissionData = {
        opinion: formState.opinion,
        fields: formData.fields.map((field) => {
          // Convert number type values from string to actual numbers
          if (field.type === "number") {
            return {
              label: field.label,
              value: formState[field.label]
                ? Number(formState[field.label])
                : null,
            };
          }

          return {
            label: field.label,
            value: formState[field.label],
          };
        }),
      };

      console.log("Submitting form data:", submissionData);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setAlertTitle("Success");
        setAlertDescription("Your feedback has been submitted successfully.");
        setAlertVariant("default");
        setIsAlert(true);
        setFormState(initialState);
      } else {
        let errorMessage = "Failed to submit feedback. Please try again.";

        if (response.status === 400) {
          errorMessage =
            "Missing field or invalid data type. Please check your form entries.";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (response.status === 500) {
          errorMessage = "Internal server error. Please try again later.";
        } else {
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {}
        }

        setAlertTitle("Error");
        setAlertDescription(errorMessage);
        setAlertVariant("destructive");
        setIsAlert(true);
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertDescription("An unexpected error occurred. Please try again.");
      setAlertVariant("destructive");
      setIsAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissAlert = () => {
    setIsAlert(false);
  };

  const renderField = (field: {
    _id: string;
    type: string;
    label: string;
    value?: string | Array<string>;
  }) => {
    switch (field.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Input
              id={field._id}
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Input
              id={field._id}
              type="number"
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "phone":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Input
              id={field._id}
              type="tel"
              placeholder="Enter phone number"
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "url":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Input
              id={field._id}
              type="url"
              placeholder="https://example.com"
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "email":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Input
              id={field._id}
              type="email"
              placeholder="email@example.com"
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Textarea
              id={field._id}
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "radio":
        const hasRadioError = validationErrors[field.label];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={hasRadioError ? "text-destructive" : ""}>
                {field.label}
              </Label>
              {hasRadioError && (
                <span className="text-xs text-destructive">
                  Please select an option
                </span>
              )}
            </div>
            <RadioGroup
              value={formState[field.label] || ""}
              onValueChange={(value) => {
                handleInputChange(field.label, value);
                // Explicitly clear validation error when a radio option is selected
                if (validationErrors[field.label]) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    [field.label]: false,
                  }));
                }
              }}
              className={`${
                hasRadioError ? "border border-destructive rounded-md p-2" : ""
              }`}
            >
              {Array.isArray(field.value) ? (
                field.value.map((option) => (
                  <div className="flex items-center space-x-2" key={option}>
                    <RadioGroupItem
                      value={option}
                      id={`${field._id}-${option}`}
                    />
                    <Label htmlFor={`${field._id}-${option}`}>{option}</Label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No options available
                </div>
              )}
            </RadioGroup>
          </div>
        );

      case "checkbox":
        const hasCheckboxError = validationErrors[field.label];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={hasCheckboxError ? "text-destructive" : ""}>
                {field.label}
              </Label>
              {hasCheckboxError && (
                <span className="text-xs text-destructive">
                  Please select at least one option
                </span>
              )}
            </div>
            <div
              className={
                hasCheckboxError
                  ? "border border-destructive rounded-md p-2"
                  : ""
              }
            >
              {Array.isArray(field.value) ? (
                field.value.map((option) => (
                  <div className="flex items-center space-x-2" key={option}>
                    <Checkbox
                      id={`${field._id}-${option}`}
                      checked={(formState[field.label] || []).includes(option)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          field.label,
                          option,
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor={`${field._id}-${option}`}>{option}</Label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No options available
                </div>
              )}
            </div>
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Select
              value={formState[field.label] || ""}
              onValueChange={(value) => handleInputChange(field.label, value)}
              required
            >
              <SelectTrigger id={field._id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(field.value) ? (
                  field.value.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No options available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Input
              id={field._id}
              type="date"
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "time":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <Input
              id={field._id}
              type="time"
              value={formState[field.label] || ""}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              required
            />
          </div>
        );

      case "color":
        return (
          <div className="space-y-2">
            <Label htmlFor={field._id}>{field.label}</Label>
            <div className="flex items-center gap-3">
              <Input
                id={field._id}
                type="color"
                value={formState[field.label] || "#000000"}
                onChange={(e) => handleInputChange(field.label, e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
                required
              />
              <span className="text-sm">
                {formState[field.label] || "#000000"}
              </span>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <p>Unsupported field type: {field.type}</p>
          </div>
        );
    }
  };

  const renderOpinion = () => {
    if (!formData.opinion || !formData.opinion.length) {
      return null;
    }

    const hasError = validationErrors.opinion;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className={hasError ? "text-destructive" : ""}>Opinion</Label>
          {hasError && (
            <span className="text-xs text-destructive">
              Please select an opinion
            </span>
          )}
        </div>
        <div
          className={`${
            hasError ? "border border-destructive rounded-md p-4" : "p-2"
          } border rounded-md bg-muted/20 flex justify-between items-center`}
        >
          {formData.opinion.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => handleInputChange("opinion", option)}
              className={`flex flex-col items-center p-2 rounded-md transition-all ${
                formState.opinion === option
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "hover:bg-muted/50"
              }`}
              title={option}
              aria-label={option}
              aria-pressed={formState.opinion === option}
            >
              <span className="text-3xl cursor-pointer">
                {opinionEmojis[option.toLowerCase()] || option}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {/* Add margin top and separator before opinion section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          {renderOpinion()}
        </div>

        {formData.opinion &&
          formData.opinion.length > 0 &&
          formData.fields.length > 0 && <hr className="my-6 border-gray-200" />}

        {formData.fields.map((field) => (
          <div key={field.label} className="form-field-container">
            {renderField(field)}
          </div>
        ))}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </form>

      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0">
          <Alert variant={alertVariant} className="max-w-md relative">
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={dismissAlert}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        </div>
      )}
    </>
  );
}
