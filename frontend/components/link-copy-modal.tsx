import { Copy, Terminal } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface LinkCopyModalProps {
  formId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkCopyModal({
  formId,
  open,
  onOpenChange,
}: LinkCopyModalProps) {
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<"default" | "destructive">(
    "default"
  );

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_FRONTEND_URL || "";

  const embedUrl = `${baseUrl}/embed/form/${formId}`;
  const directUrl = `${baseUrl}/form/${formId}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="500px"
  style={{ border: "none", borderRadius: "8px" }}
></iframe>`;

  const buttonCode = `<script src="${baseUrl}/embed/widget/embed.js" data-formid="${formId}"></script>`;

  const nextJsCode = `<Script src="${baseUrl}/embed/widget/embed.js" data-formid="${formId}" strategy="lazyOnload" ></Script>`;

  const reactJsCode = `useEffect(() => {
  // Create script element
  const script = document.createElement("script");
  script.src = "${baseUrl}/embed/widget/embed.js";
  script.setAttribute("data-formid", "${formId}");
  // script.setAttribute("data-target", "button-container"); // Specify target if supported
  script.async = true;
  
  // Append to document body
  document.body.appendChild(script);
  
  // Cleanup function
  return () => {
    document.body.removeChild(script);
  };
}, []);`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setAlertTitle("Copied to clipboard");
    setAlertDescription("The embed code has been copied to your clipboard.");
    setAlertVariant("default");
    setIsAlert(true);
    setTimeout(() => {
      setIsAlert(false);
    }, 3000);
  };

  // Shared documentation component
  const CustomizationDocs = ({
    isReactJs = false,
  }: {
    isReactJs?: boolean;
  }) => (
    <div className="mt-4 border rounded-md">
      <div className="bg-muted px-4 py-2 border-b">
        <h4 className="font-medium text-sm">Customization Options</h4>
      </div>
      <div className="p-4 text-xs space-y-4 max-h-64 overflow-y-auto">
        <div>
          <h5 className="font-medium mb-1">Button Options</h5>
          <ul className="space-y-1 opacity-90">
            <li>
              {isReactJs ? (
                <code>
                  script.setAttribute("data-button-text", "Your Text")
                </code>
              ) : (
                <code>data-button-text</code>
              )}
              {' - Button text (default: "Give Feedback")'}
            </li>
            <li>
              {isReactJs ? (
                <code>
                  script.setAttribute("data-button-position", "bottom-right")
                </code>
              ) : (
                <code>data-button-position</code>
              )}
              {
                ' - Position on screen: "bottom-right", "bottom-left", "top-right", "top-left" (default: "bottom-right")'
              }
            </li>
            <li>
              {isReactJs ? (
                <code>script.setAttribute("data-button-style-*", "value")</code>
              ) : (
                <code>data-button-style-*</code>
              )}
              {" - Any CSS property (e.g., "}
              {isReactJs ? (
                <code>
                  script.setAttribute("data-button-style-background-color",
                  "#000")
                </code>
              ) : (
                <code>data-button-style-background-color="#000"</code>
              )}
              {")"}
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-1">Modal Options</h5>
          <ul className="space-y-1 opacity-90">
            <li>
              {isReactJs ? (
                <code>script.setAttribute("data-modal-style-*", "value")</code>
              ) : (
                <code>data-modal-style-*</code>
              )}
              {" - Any CSS property (e.g., "}
              {isReactJs ? (
                <code>
                  script.setAttribute("data-modal-style-backdrop-filter",
                  "blur(5px)")
                </code>
              ) : (
                <code>data-modal-style-backdrop-filter="blur(5px)"</code>
              )}
              {")"}
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-1">Iframe Options</h5>
          <ul className="space-y-1 opacity-90">
            <li>
              {isReactJs ? (
                <code>script.setAttribute("data-iframe-width", "90%")</code>
              ) : (
                <code>data-iframe-width</code>
              )}
              {' - Width of iframe (default: "90%")'}
            </li>
            <li>
              {isReactJs ? (
                <code>script.setAttribute("data-iframe-height", "80%")</code>
              ) : (
                <code>data-iframe-height</code>
              )}
              {' - Height of iframe (default: "80%")'}
            </li>
            <li>
              {isReactJs ? (
                <code>script.setAttribute("data-iframe-*", "value")</code>
              ) : (
                <code>data-iframe-*</code>
              )}
              {" - Any iframe attribute ("}
              <code>frameborder</code>
              {", "}
              <code>allowtransparency</code>
              {", etc.)"}
            </li>
            <li>
              {isReactJs ? (
                <code>
                  script.setAttribute("data-iframe-style",
                  "&#123;"borderRadius":"8px"&#125;")
                </code>
              ) : (
                <>
                  <code>data-iframe-style</code>
                  {" - JSON string of CSS properties. Example:"}
                  <div className="mt-1 bg-muted p-1 rounded">
                    <code>
                      data-iframe-style='&#123;"borderRadius":"8px"&#125;'
                    </code>
                  </div>
                </>
              )}
              {isReactJs && " - JSON string of CSS properties"}
            </li>
            <li>
              {isReactJs ? (
                <code>script.setAttribute("data-iframe-style-*", "value")</code>
              ) : (
                <code>data-iframe-style-*</code>
              )}
              {" - Any CSS property"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

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
          className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-auto p-6 relative max-h-[calc(100vh-20px)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 w-full">
            <div>
              <h2 className="text-lg font-semibold">Embed Form</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Choose how you want to embed this form on your website.
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
          <Tabs defaultValue="iframe">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="iframe">Embed Form</TabsTrigger>
              <TabsTrigger value="button">Floating Button</TabsTrigger>
            </TabsList>

            <TabsContent value="iframe" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Embed the form directly on your page:
              </div>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="iframe-code" className="sr-only">
                    Iframe Code
                  </Label>
                  <Input id="iframe-code" defaultValue={iframeCode} readOnly />
                </div>
                <Button
                  size="sm"
                  className="px-3"
                  onClick={() => handleCopy(iframeCode)}
                >
                  <span className="sr-only">Copy</span>
                  <Copy />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="button" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Add a floating feedback button that opens the form in a popup:
              </div>

              <Tabs defaultValue="nextjs" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="nextjs">Next.js</TabsTrigger>
                  <TabsTrigger value="reactjs">React.js</TabsTrigger>
                </TabsList>

                <TabsContent value="nextjs" className="space-y-2">
                  <div className="text-xs text-muted-foreground mt-2">
                    Import from next/script:{" "}
                    <code>import Script from 'next/script'</code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="nextjs-code" className="sr-only">
                        Next.js Code
                      </Label>
                      <Input
                        id="nextjs-code"
                        defaultValue={`<Script
  src="${baseUrl}/embed/widget/embed.js"
  data-formid="${formId}"
  data-button-text="Give Feedback"
  data-button-position="bottom-right"
  data-button-style-background-color="#0070f3"
  data-iframe-width="90%"
  data-iframe-height="80%"
  strategy="lazyOnload"
></Script>`}
                        readOnly
                      />
                    </div>
                    <Button
                      size="sm"
                      className="px-3"
                      onClick={() => handleCopy(nextJsCode)}
                    >
                      <span className="sr-only">Copy</span>
                      <Copy />
                    </Button>
                  </div>

                  <CustomizationDocs isReactJs={false} />
                </TabsContent>

                <TabsContent value="reactjs" className="space-y-2">
                  <div className="text-xs text-muted-foreground mt-2">
                    Use in a React.js component with useEffect:
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="reactjs-code" className="sr-only">
                        React.js Code
                      </Label>
                      <textarea
                        id="reactjs-code"
                        className="flex h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={`useEffect(() => {
  // Create script element
  const script = document.createElement("script");
  script.src = "${baseUrl}/embed/widget/embed.js";
  script.setAttribute("data-formid", "${formId}");
  script.setAttribute("data-button-text", "Give Feedback");
  script.setAttribute("data-button-position", "bottom-right");
  script.setAttribute("data-button-style-background-color", "#0070f3");
  script.setAttribute("data-iframe-width", "90%");
  script.setAttribute("data-iframe-height", "80%");
  script.async = true;
  
  // Append to document body
  document.body.appendChild(script);
  
  // Cleanup function
  return () => {
    document.body.removeChild(script);
  };
}, []);`}
                        readOnly
                      />
                    </div>
                    <Button
                      size="sm"
                      className="px-3"
                      onClick={() => handleCopy(reactJsCode)}
                    >
                      <span className="sr-only">Copy</span>
                      <Copy />
                    </Button>
                  </div>

                  <CustomizationDocs isReactJs={true} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

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
