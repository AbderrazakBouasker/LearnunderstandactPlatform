import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FormImportModal } from "@/components/form-import-modal";

export function FormsForm({
  action,
  form,
  onAlert,
  selectedOrganization,
}: {
  action: string;
  form?: {
    _id: string;
    title: string;
    description: string;
    opinion: string[];
    fields: {
      label: string;
      type: string;
      value: string | string[];
      options?: string[];
    }[];
    createdAt: string;
    updatedAt: string;
  };
  onAlert?: (alertInfo: {
    title: string;
    description: string;
    variant: "default" | "destructive";
  }) => void;
  selectedOrganization: string;
}) {
  const opinionTemplates = {
    "5-point": [
      "very dissatisfied",
      "dissatisfied",
      "neutral",
      "satisfied",
      "very satisfied",
    ],
    "7-point": [
      "very dissatisfied",
      "dissatisfied",
      "somewhat dissatisfied",
      "neutral",
      "somewhat satisfied",
      "satisfied",
      "very satisfied",
    ],
    "3-point": ["dissatisfied", "neutral", "satisfied"],
  };

  const [selectedTemplate, setSelectedTemplate] = useState<
    "3-point" | "5-point" | "7-point"
  >(
    form?.opinion
      ? form.opinion.length === 3
        ? "3-point"
        : form.opinion.length === 7
        ? "7-point"
        : "5-point"
      : "5-point"
  );

  const [formData, setFormData] = useState({
    _id: form?._id || "",
    title: form?.title || "",
    description: form?.description || "",
    opinion: form?.opinion || opinionTemplates[selectedTemplate],
    fields: form?.fields || [],
    createdAt: form?.createdAt || "",
    updatedAt: form?.updatedAt || "",
    organization: selectedOrganization,
  });

  const opinionEmojis: Record<string, string> = {
    "very dissatisfied": "😠",
    dissatisfied: "🙁",
    "somewhat dissatisfied": "😕",
    neutral: "😐",
    "somewhat satisfied": "🙂",
    satisfied: "😊",
    "very satisfied": "😄",
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value as "3-point" | "5-point" | "7-point";
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      opinion: opinionTemplates[template],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const [newField, setNewField] = useState({
    label: "",
    type: "text",
    value: "",
    options: [] as string[],
  });

  const [importModalOpen, setImportModalOpen] = useState(false);

  const addField = () => {
    if (newField.label.trim() === "") {
      alert("Field label is required");
      return;
    }

    if (
      (newField.type === "checkbox" || newField.type === "radio") &&
      newField.options.length === 0
    ) {
      alert(
        `${
          newField.type === "checkbox" ? "Checkbox" : "Radio"
        } fields require at least one option`
      );
      return;
    }

    let fieldToAdd = { ...newField };

    if (newField.type === "checkbox" || newField.type === "radio") {
      const options = [...newField.options];

      if (newField.value) {
        const defaultIndex = options.findIndex((opt) => opt === newField.value);
        if (defaultIndex >= 0) {
          const defaultOption = options.splice(defaultIndex, 1)[0];
          options.unshift(defaultOption);
        }
      }

      fieldToAdd = {
        ...fieldToAdd,
        value: options,
        selectedOption: newField.value,
        options: [],
      };
    }

    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, fieldToAdd],
    }));

    setNewField({
      label: "",
      type: "text",
      value: "",
      options: [],
    });
  };

  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    if (newOption.trim() === "") return;

    setNewField((prev) => ({
      ...prev,
      options: [...prev.options, newOption.trim()],
    }));

    setNewOption("");
  };

  const removeOption = (index: number) => {
    setNewField((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewField((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const removeField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const showAlert = (
    title: string,
    description: string,
    variant: "default" | "destructive"
  ) => {
    if (onAlert) {
      onAlert({
        title,
        description,
        variant,
      });
    }
  };

  const handleImport = (importedData: {
    title: string;
    description: string;
    opinion: string[];
    fields: {
      label: string;
      type: string;
      value: string | string[];
      options?: string[];
    }[];
  }) => {
    // Determine the template based on opinion array length
    let template: "3-point" | "5-point" | "7-point" = "5-point";
    if (importedData.opinion.length === 3) {
      template = "3-point";
    } else if (importedData.opinion.length === 7) {
      template = "7-point";
    }

    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      title: importedData.title,
      description: importedData.description,
      opinion: importedData.opinion,
      fields: importedData.fields,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = { ...formData };

    dataToSubmit.fields = formData.fields.map((field: any) => {
      if (field.type !== "checkbox" && field.type !== "radio") {
        return field;
      }

      if (field.options && !Array.isArray(field.value)) {
        let options = [...field.options];

        if (
          field.value &&
          typeof field.value === "string" &&
          options.includes(field.value)
        ) {
          options = options.filter((opt) => opt !== field.value);
          options.unshift(field.value);
        }

        return {
          ...field,
          value: options,
          options: undefined,
        };
      }

      return field;
    });

    try {
      let response;

      if (action === "create") {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSubmit),
            credentials: "include",
          }
        );
      } else if (action === "edit") {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/${dataToSubmit._id}/edit`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSubmit),
            credentials: "include",
          }
        );
      }
      if (response?.status === 201) {
        showAlert("Success", `Form created successfully`, "default");
      } else if (response?.ok) {
        showAlert("Success", `Form updated successfully`, "default");
      } else {
        if (response?.status === 401) {
          showAlert("Unauthorized", "Invalid or expired token", "destructive");
        } else if (response?.status === 403) {
          showAlert(
            "Forbidden",
            "Not authorized or missing token",
            "destructive"
          );
        } else if (response?.status === 404 && action === "edit") {
          showAlert("Not Found", "Form not found", "destructive");
        } else if (response?.status === 429) {
          showAlert(
            "Too Many Requests",
            "Please wait a few minutes before trying again",
            "destructive"
          );
        } else if (response?.status === 500) {
          showAlert(
            "Server Error",
            "An error occurred. Please try again",
            "destructive"
          );
        } else {
          showAlert(
            "Error",
            `Failed to ${action} form. Please try again.`,
            "destructive"
          );
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing form:`, error);
      showAlert(
        "Error",
        `An error occurred while trying to ${action} the form. Please try again.`,
        "destructive"
      );
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle>
              {action === "create"
                ? "Create a new Form"
                : action === "edit"
                ? "Edit the Form"
                : action === "view"
                ? "Form Details"
                : null}
            </DialogTitle>
            <DialogDescription>
              {action === "create"
                ? "Create a new Form here. Click save when you're done."
                : action === "edit"
                ? "Edit the Form here. Click save when you're done."
                : action === "view"
                ? "View the form details."
                : null}
            </DialogDescription>
          </div>
          {action === "create" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="ml-4"
            >
              Import Form
            </Button>
          )}
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="col-span-3"
                disabled={action === "view"}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="col-span-3"
                disabled={action === "view"}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="opinion" className="text-right">
                Opinions
              </Label>
              <div className="col-span-3">
                {action !== "view" && (
                  <div className="mb-3">
                    <Label
                      htmlFor="template-select"
                      className="text-sm mb-1 block"
                    >
                      Choose Opinion Template
                    </Label>
                    <select
                      id="template-select"
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mb-2"
                      disabled={action === "view"}
                    >
                      <option value="3-point">3-point scale (Simple)</option>
                      <option value="5-point">5-point scale (Standard)</option>
                      <option value="7-point">7-point scale (Detailed)</option>
                    </select>
                  </div>
                )}

                <div className="border rounded-md p-4 bg-muted/20 min-h-[80px] flex items-center justify-between">
                  {formData.opinion.map((op, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span
                        className="text-3xl"
                        title={op} // Add title attribute for accessibility/tooltip
                      >
                        {opinionEmojis[op.toLowerCase()] || op}
                      </span>
                    </div>
                  ))}
                </div>
                {action !== "view" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    These opinion options will be shown to users when they fill
                    out this form.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Form Fields</Label>
              <div className="col-span-3 space-y-4">
                {formData.fields.length > 0 && (
                  <div className="rounded-md border p-4 space-y-3">
                    <h4 className="text-sm font-medium mb-2">
                      {action === "view" ? "Fields" : "Added Fields"}
                    </h4>
                    {formData.fields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted/40 p-2 rounded-md"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{field.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Type: {field.type}
                            {field.value && !Array.isArray(field.value)
                              ? ` • Default: ${field.value}`
                              : ""}
                          </p>
                          {(field.type === "checkbox" ||
                            field.type === "radio") &&
                            field.value &&
                            Array.isArray(field.value) &&
                            field.value.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Options: {field.value.join(", ")}
                              </p>
                            )}
                        </div>
                        {action !== "view" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(index)}
                          >
                            <span className="sr-only">Remove</span>×
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {action !== "view" && (
                  <div className="rounded-md border p-4 space-y-3">
                    <h4 className="text-sm font-medium">Add New Field</h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 flex flex-col">
                        <Label htmlFor="field-label" className="min-h-[1.5rem]">
                          Label
                        </Label>
                        <Input
                          id="field-label"
                          name="label"
                          value={newField.label}
                          onChange={handleFieldChange}
                          placeholder="e.g. First Name"
                        />
                      </div>

                      <div className="space-y-1 flex flex-col">
                        <Label htmlFor="field-type" className="min-h-[1.5rem]">
                          Type
                        </Label>
                        <select
                          id="field-type"
                          name="type"
                          value={newField.type}
                          onChange={handleFieldChange}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="textarea">Textarea</option>
                          <option value="tel">Telephone</option>
                          <option value="url">URL</option>
                          <option value="color">Color</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="radio">Radio</option>
                        </select>
                      </div>

                      <div className="space-y-1 flex flex-col">
                        <Label htmlFor="field-value" className="min-h-[1.5rem]">
                          {newField.type === "checkbox" ||
                          newField.type === "radio"
                            ? "Default Selected Option"
                            : "Default Value (Optional)"}
                        </Label>
                        {newField.type === "checkbox" ||
                        newField.type === "radio" ? (
                          <select
                            id="field-value"
                            name="value"
                            value={newField.value}
                            onChange={handleFieldChange}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          >
                            <option value="">No default selection</option>
                            {newField.options.map((option, i) => (
                              <option key={i} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : newField.type === "color" ? (
                          <div className="flex space-x-2">
                            <Input
                              id="field-value"
                              name="value"
                              value={newField.value}
                              onChange={handleFieldChange}
                              placeholder="#000000"
                            />
                            <input
                              type="color"
                              value={newField.value || "#000000"}
                              onChange={(e) =>
                                setNewField((prev) => ({
                                  ...prev,
                                  value: e.target.value,
                                }))
                              }
                              className="h-9 w-12 p-0 border rounded"
                            />
                          </div>
                        ) : (
                          <Input
                            id="field-value"
                            name="value"
                            value={newField.value}
                            onChange={handleFieldChange}
                            placeholder="Default value"
                          />
                        )}
                      </div>
                    </div>

                    {(newField.type === "checkbox" ||
                      newField.type === "radio") && (
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        <Label>Options</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyDown={handleOptionKeyDown}
                            placeholder="Add option and press Enter"
                            className="flex-grow"
                          />
                          <Button type="button" onClick={addOption} size="sm">
                            Add
                          </Button>
                        </div>

                        {newField.options.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md">
                            {newField.options.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center bg-muted px-2 py-1 rounded-md text-sm"
                              >
                                {option}
                                <button
                                  type="button"
                                  className="ml-1 text-xs rounded-full h-4 w-4 inline-flex items-center justify-center hover:bg-secondary-foreground/20"
                                  onClick={() => removeOption(index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Button type="button" onClick={addField} className="w-full">
                      Add Field
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {action !== "view" && (
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        )}
      </form>

      {/* Import Modal */}
      <FormImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
      />
    </>
  );
}
