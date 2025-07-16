import { Terminal, Upload, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormData {
  title: string;
  description: string;
  opinion: string[];
  fields: {
    label: string;
    type: string;
    value: string | string[];
    options?: string[];
  }[];
}

interface FormImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (formData: FormData) => void;
}

export function FormImportModal({
  open,
  onOpenChange,
  onImport,
}: FormImportModalProps) {
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<"default" | "destructive">(
    "default"
  );
  const [jsonText, setJsonText] = useState("");
  const [isValidJson, setIsValidJson] = useState(false);
  const [parsedData, setParsedData] = useState<FormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showAlert = (
    title: string,
    description: string,
    variant: "default" | "destructive"
  ) => {
    setAlertTitle(title);
    setAlertDescription(description);
    setAlertVariant(variant);
    setIsAlert(true);
    setTimeout(() => {
      setIsAlert(false);
    }, 3000);
  };

  const validateAndParseJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);

      // Validate required fields
      if (!parsed.title || !parsed.description) {
        throw new Error("Form must have title and description");
      }

      if (!Array.isArray(parsed.opinion)) {
        throw new Error("Opinion field must be an array");
      }

      if (!Array.isArray(parsed.fields)) {
        throw new Error("Fields must be an array");
      }

      // Validate field structure
      for (const field of parsed.fields) {
        if (!field.label || !field.type) {
          throw new Error("Each field must have label and type");
        }
      }

      const formData: FormData = {
        title: parsed.title,
        description: parsed.description,
        opinion: parsed.opinion,
        fields: parsed.fields,
      };

      setParsedData(formData);
      setIsValidJson(true);
      return true;
    } catch (error) {
      setIsValidJson(false);
      setParsedData(null);
      showAlert(
        "Invalid JSON",
        error instanceof Error ? error.message : "Invalid JSON format",
        "destructive"
      );
      return false;
    }
  };

  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);

    if (text.trim()) {
      validateAndParseJson(text);
    } else {
      setIsValidJson(false);
      setParsedData(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      showAlert("Invalid File", "Please select a JSON file", "destructive");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      validateAndParseJson(text);
    };
    reader.onerror = () => {
      showAlert("File Error", "Failed to read the file", "destructive");
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsedData || !isValidJson) {
      showAlert(
        "No Data",
        "Please provide valid form JSON data",
        "destructive"
      );
      return;
    }

    onImport(parsedData);
    showAlert("Success", "Form data imported successfully", "default");

    // Close modal after successful import
    setTimeout(() => {
      onOpenChange(false);
      setJsonText("");
      setParsedData(null);
      setIsValidJson(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 1000);
  };

  const handleClearData = () => {
    setJsonText("");
    setParsedData(null);
    setIsValidJson(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
              <h2 className="text-lg font-semibold">Import Form</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Import a form configuration from JSON text or file
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
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Paste JSON Text</TabsTrigger>
              <TabsTrigger value="file">Upload JSON File</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json-text">Form JSON Data</Label>
                <textarea
                  id="json-text"
                  className="w-full h-64 p-4 text-sm font-mono bg-background rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  value={jsonText}
                  onChange={handleJsonTextChange}
                  placeholder='Paste your form JSON here, e.g.:
{
  "title": "Customer Feedback",
  "description": "Please provide your feedback",
  "opinion": ["dissatisfied", "neutral", "satisfied"],
  "fields": [
    {
      "label": "Name",
      "type": "text",
      "value": ""
    }
  ]
}'
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json-file">Upload JSON File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to select a JSON file or drag and drop
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="json-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select JSON File
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview Section */}
          {parsedData && isValidJson && (
            <div className="mt-6 p-4 bg-muted/50 rounded-md">
              <h4 className="font-medium text-sm mb-2">Preview</h4>
              <div className="text-xs space-y-1">
                <p>
                  <strong>Title:</strong> {parsedData.title}
                </p>
                <p>
                  <strong>Description:</strong> {parsedData.description}
                </p>
                <p>
                  <strong>Opinion Options:</strong> {parsedData.opinion.length}{" "}
                  options
                </p>
                <p>
                  <strong>Fields:</strong> {parsedData.fields.length} fields
                </p>
              </div>
            </div>
          )}

          {/* Validation Status */}
          <div className="mt-4 flex items-center gap-2">
            {jsonText && (
              <div
                className={`text-xs px-2 py-1 rounded ${
                  isValidJson
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {isValidJson ? "✓ Valid JSON" : "✗ Invalid JSON"}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-2 mt-6 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearData}
              disabled={!jsonText}
            >
              Clear
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!isValidJson || !parsedData}
              >
                Import Form
              </Button>
            </div>
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
