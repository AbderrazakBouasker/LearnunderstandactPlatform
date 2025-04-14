import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MovableBadge } from "@/components/ui/movable-badge";
import { useState, useRef } from "react";

export function FormsForm({
  action,
  form,
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
      value: string;
      options?: string[];
    }[];
    createdAt: string;
    updatedAt: string;
  };
}) {
  const [formData, setFormData] = useState({
    _id: form?._id || "",
    title: form?.title || "",
    description: form?.description || "",
    opinion: form?.opinion || ["unhappy", "neutral", "happy"],
    fields: form?.fields || [],
    createdAt: form?.createdAt || "",
    updatedAt: form?.updatedAt || "",
  });
  const [newOpinion, setNewOpinion] = useState("");
  const [newField, setNewField] = useState({
    label: "",
    type: "text",
    value: "",
    options: [] as string[], // Added options array for checkbox/radio
  });
  const [opinionPositions, setOpinionPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const opinionContainerRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleReorderOpinions = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const opinions = [...prev.opinion];
      const [movedOpinion] = opinions.splice(fromIndex, 1);
      opinions.splice(toIndex, 0, movedOpinion);
      return {
        ...prev,
        opinion: opinions,
      };
    });

    // Also update position tracking after reordering
    setOpinionPositions({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const addOpinion = () => {
    if (newOpinion.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        opinion: [...prev.opinion, newOpinion.trim()],
      }));
      setNewOpinion("");
    }
  };

  const removeOpinion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      opinion: prev.opinion.filter((_, i) => i !== index),
    }));

    // Clean up position data for the removed opinion
    setOpinionPositions((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleOpinionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOpinion();
    }
  };

  const updateOpinionPosition = (
    index: number,
    position: { x: number; y: number }
  ) => {
    setOpinionPositions((prev) => ({
      ...prev,
      [index]: position,
    }));
  };

  const addField = () => {
    if (newField.label.trim() === "") {
      alert("Field label is required");
      return;
    }

    // Validate that checkbox and radio have options
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

    // Create a field object to add to the form
    let fieldToAdd = { ...newField };

    // For checkbox and radio, put all options directly in the value field
    if (newField.type === "checkbox" || newField.type === "radio") {
      // Create a copy of options
      let options = [...newField.options];

      // If a default value is set, move it to the beginning of the array
      if (newField.value) {
        const defaultIndex = options.findIndex((opt) => opt === newField.value);
        if (defaultIndex >= 0) {
          // Remove from current position and add to beginning
          const defaultOption = options.splice(defaultIndex, 1)[0];
          options.unshift(defaultOption);
        }
      }

      // Store the options directly in the value field
      fieldToAdd = {
        ...fieldToAdd,
        value: options, // Set options array directly as value
        selectedOption: newField.value, // Keep track of selected value separately for UI only
        options: undefined, // Remove the separate options field
      };
    }

    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, fieldToAdd],
    }));

    // Reset field form
    setNewField({
      label: "",
      type: "text",
      value: "",
      options: [],
    });
  };

  // Add option to checkbox/radio options list
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Make a copy of the form data to send to the server
    const dataToSubmit = { ...formData };

    // Ensure all checkbox and radio fields have options in their value field
    dataToSubmit.fields = formData.fields.map((field: any) => {
      if (field.type !== "checkbox" && field.type !== "radio") {
        return field;
      }

      // If we still have options in a separate field, move them to value
      if (field.options && !Array.isArray(field.value)) {
        // Get the options array
        let options = [...field.options];

        // If there's a selected value, put it first
        if (
          field.value &&
          typeof field.value === "string" &&
          options.includes(field.value)
        ) {
          // Remove from current position
          options = options.filter((opt) => opt !== field.value);
          // Add to beginning
          options.unshift(field.value);
        }

        return {
          ...field,
          value: options, // Use options array as value
          options: undefined, // Remove separate options field
        };
      }

      return field;
    });

    //console.log("Submitting form data:", JSON.stringify(dataToSubmit));

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

      if (!response || !response.ok) {
        //console.log("Response not OK:", response);
        //console.log(formData);
        throw new Error(`Failed to ${action} form`);
      }

      // Handle successful response
      //console.log(`Form ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing form:`, error);
    }
  };

  return (
    <>
      <DialogHeader>
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
                  <Input
                    id="opinion"
                    value={newOpinion}
                    onChange={(e) => setNewOpinion(e.target.value)}
                    onKeyDown={handleOpinionKeyDown}
                    placeholder="Type and press Enter to add"
                    className="mb-2"
                  />
                )}

                <div
                  className="border rounded-md p-4 bg-muted/20 min-h-[100px] flex flex-wrap relative"
                  ref={opinionContainerRef}
                >
                  {formData.opinion.map((op, index) => (
                    <MovableBadge
                      key={`${op}-${index}`}
                      variant="secondary"
                      onRemove={
                        action !== "view"
                          ? () => removeOpinion(index)
                          : undefined
                      }
                      onDragStart={
                        action !== "view"
                          ? () => setDraggingIndex(index)
                          : undefined
                      }
                      onDragEnd={
                        action !== "view" ? handleReorderOpinions : undefined
                      }
                      index={index}
                      totalItems={formData.opinion.length}
                      draggable={action !== "view"}
                    >
                      {op}
                    </MovableBadge>
                  ))}
                </div>
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
                            {field.value ? ` • Default: ${field.value}` : ""}
                          </p>
                          {/* Display options for checkbox and radio fields */}
                          {(field.type === "checkbox" ||
                            field.type === "radio") &&
                            field.value &&
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

                    {/* Options section for checkbox and radio types */}
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
    </>
  );
}
