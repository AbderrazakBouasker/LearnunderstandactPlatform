import { Copy, Terminal } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function LinkCopyModal({ formId }: { formId: string }) {
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

  return (
    <>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Embed Form</DialogTitle>
          <DialogDescription>
            Choose how you want to embed this form on your website.
          </DialogDescription>
        </DialogHeader>

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
                      defaultValue={nextJsCode}
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
                      className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={reactJsCode}
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
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

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
