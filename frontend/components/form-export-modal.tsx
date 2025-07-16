import { Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Form {
  _id: string;
  title: string;
  description: string;
  opinion: unknown[];
  fields: unknown[];
  createdAt: string;
  updatedAt: string;
}

interface FormExportModalProps {
  form: Form;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormExportModal({
  form,
  open,
  onOpenChange,
}: FormExportModalProps) {
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<"default" | "destructive">(
    "default"
  );

  // Create exportable form data (excluding system fields)
  const exportableForm = {
    title: form?.title || "",
    description: form?.description || "",
    fields: form?.fields || [],
    opinion: form?.opinion || [],
    // Add any other fields you want to include in the export
  };

  const jsonString = JSON.stringify(exportableForm, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setAlertTitle("Copied to clipboard");
    setAlertDescription("The form JSON has been copied to your clipboard.");
    setAlertVariant("default");
    setIsAlert(true);
    setTimeout(() => {
      setIsAlert(false);
    }, 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.title || "form"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setAlertTitle("Download started");
    setAlertDescription("The form JSON file is being downloaded.");
    setAlertVariant("default");
    setIsAlert(true);
    setTimeout(() => {
      setIsAlert(false);
    }, 3000);
  };

  if (!open) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0, 0, 0, 0.5)" }}
        onClick={() => onOpenChange(false)}
      >
        {/* Modal Content */}
        <div
          className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-auto p-6 relative max-h-[calc(100vh-20px)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 w-full">
            <div>
              <h2 className="text-lg font-semibold">Export Form</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Copy or download the form configuration in JSON format for
                import later.
              </p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none ml-2"
              style={{ width: "2.5rem", height: "2.5rem" }}
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Form: <span className="font-medium">{form?.title}</span>
            </div>

            {/* JSON Display */}
            <div className="relative">
              <textarea
                className="w-full h-96 p-4 text-sm font-mono bg-muted rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={jsonString}
                readOnly
                placeholder="Form JSON will appear here..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy JSON
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex items-center gap-2"
              >
                Download JSON
              </Button>
            </div>

            {/* Usage Instructions */}
            <div className="mt-6 p-4 bg-muted rounded-md">
              <h4 className="font-medium text-sm mb-2">Usage Instructions</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>
                  • Copy the JSON to import this form configuration elsewhere
                </li>
                <li>
                  • Download as a file to keep a backup of your form structure
                </li>
                <li>
                  • The exported data includes form title, description, field
                  configurations, and responses/opinions
                </li>
                <li>
                  • System-generated fields like IDs and timestamps are excluded
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-6 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0 z-60">
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
