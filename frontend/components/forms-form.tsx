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
    id: string;
    title: string;
    description: string;
    opinion: string[];
    fields: [];
    createdAt: string;
    updatedAt: string;
  };
}) {
  const [formData, setFormData] = useState({
    id: form?.id || "",
    title: form?.title || "",
    description: form?.description || "",
    opinion: form?.opinion || ["unhappy", "neutral", "happy"],
    fields: form?.fields || [],
    createdAt: form?.createdAt || "",
    updatedAt: form?.updatedAt || "",
  });
  const [newOpinion, setNewOpinion] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (action === "create") {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create form");
        }

        // Handle successful response
        console.log("Form created successfully");
      } catch (error) {
        console.error("Error creating form:", error);
      }
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
            : null}
        </DialogTitle>
        <DialogDescription>
          {action === "create"
            ? "Create a new Form here. Click save when you're done."
            : action === "edit"
            ? "Edit the Form here. Click save when you're done."
            : null}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="col-span-3"
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
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="opinion" className="text-right">
                Opinions
              </Label>
              <div className="col-span-3">
                <Input
                  id="opinion"
                  value={newOpinion}
                  onChange={(e) => setNewOpinion(e.target.value)}
                  onKeyDown={handleOpinionKeyDown}
                  placeholder="Type and press Enter to add"
                  className="mb-2"
                />

                <div
                  className="border rounded-md p-4 bg-muted/20 min-h-[100px] flex flex-wrap relative"
                  ref={opinionContainerRef}
                >
                  {formData.opinion.map((op, index) => (
                    <MovableBadge
                      key={`${op}-${index}`}
                      variant="secondary"
                      onRemove={() => removeOpinion(index)}
                      onDragStart={() => setDraggingIndex(index)}
                      onDragEnd={handleReorderOpinions}
                      index={index}
                      totalItems={formData.opinion.length}
                    >
                      {op}
                    </MovableBadge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>Save changes</Button>
      </DialogFooter>
    </>
  );
}
