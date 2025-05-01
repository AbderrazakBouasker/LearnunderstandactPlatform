import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormsForm } from "./forms-form";
import { useState } from "react";

export function CreateFormModal({
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
    opinion: [];
    fields: [];
    organization: string;
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
  const [open, setOpen] = useState(false);

  const handleAlert = (alertInfo: {
    title: string;
    description: string;
    variant: "default" | "destructive";
  }) => {
    if (onAlert) {
      onAlert(alertInfo);
    }

    // Close the dialog if the alert indicates success
    if (alertInfo.variant === "default" && alertInfo.title === "Success") {
      setOpen(false);
    }
  };

  return (
    <>
      {action === "create" ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Create a new Form</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-auto max-h-[90vh] overflow-y-auto">
            <FormsForm
              action="create"
              onAlert={handleAlert}
              selectedOrganization={selectedOrganization}
            />
          </DialogContent>
        </Dialog>
      ) : action === "edit" && form ? (
        <DialogContent className="max-w-2xl w-auto max-h-[90vh] overflow-y-auto">
          <FormsForm action="edit" form={form} onAlert={handleAlert} />
        </DialogContent>
      ) : action === "view" && form ? (
        <DialogContent className="max-w-2xl w-auto max-h-[90vh] overflow-y-auto">
          <FormsForm action="view" form={form} onAlert={handleAlert} />
        </DialogContent>
      ) : null}
    </>
  );
}
