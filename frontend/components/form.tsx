"use client";
import { DataTableForm } from "@/components/data-table-form";
import { CreateFormModal } from "./create-form-modal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useState } from "react";

export function Form({
  selectedOrganization,
}: {
  selectedOrganization: string;
}) {
  const [isAlert, setIsAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertVariant, setAlertVariant] = useState<"default" | "destructive">(
    "default"
  );

  const handleAlert = (alertInfo: {
    title: string;
    description: string;
    variant: "default" | "destructive";
  }) => {
    setAlertTitle(alertInfo.title);
    setAlertDescription(alertInfo.description);
    setAlertVariant(alertInfo.variant);
    setIsAlert(true);
    setTimeout(() => {
      setIsAlert(false);
    }, 3000);
  };

  return (
    <>
      <CreateFormModal
        action="create"
        onAlert={handleAlert}
        selectedOrganization={selectedOrganization}
      />
      <DataTableForm selectedOrganization={selectedOrganization} />

      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0">
          <Alert variant={alertVariant}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
