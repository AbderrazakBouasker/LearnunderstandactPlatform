import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal, Loader2 } from "lucide-react";

interface OrganizationCreateModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OrganizationCreateModal({
  open,
  onOpenChange,
  userData,
}: {
  OrganizationCreateModalProps: any;
  UserData: {
    _id: string;
    username: string;
    email: string;
    organization: string[];
    createdAt: string;
    organizationDetails: [];
    id: string;
  };
}) {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [nameError, setNameError] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  // Alert state
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);

  // Use either controlled or uncontrolled open state
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  // Reset form errors when input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setNameError("");
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    setIdentifierError("");
  };

  const validateForm = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError("Organization name is required");
      isValid = false;
    }

    if (!identifier.trim()) {
      setIdentifierError("Organization identifier is required");
      isValid = false;
    }

    return isValid;
  };

  const resetForm = () => {
    setName("");
    setIdentifier("");
    setNameError("");
    setIdentifierError("");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // First API call: Create the organization
      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            identifier,
            members: [{ user: userData._id, role: "admin" }],
          }),
          credentials: "include",
        }
      );

      const createData = await createResponse.json();

      if (createResponse.ok) {
        // Second API call: Add user to the organization
        try {
          const addToOrgResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/user/${userData._id}/addtoorganization`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ organizationIdentifier: identifier }),
              credentials: "include",
            }
          );

          if (!addToOrgResponse.ok) {
            const addToOrgData = await addToOrgResponse.json();
            console.error(
              "Failed to add user to organization:",
              addToOrgData.error
            );
            // We'll still show success for organization creation but log the error
          }
        } catch (addError) {
          console.error("Error adding user to organization:", addError);
        }

        // Success case
        setAlertTitle("Success");
        setAlertDescription("Organization created successfully");
        setAlertVariant("default");
        setIsAlert(true);
        handleOpenChange(false);
        resetForm();

        // Refresh the page after a short delay to show the new organization
        setTimeout(() => {
          setIsAlert(false);
          window.location.reload();
        }, 3000);
      } else {
        // Error handling for organization creation
        setAlertTitle("Error");
        setAlertDescription(
          createData.error || "Failed to create organization"
        );
        setAlertVariant("destructive");
        setIsAlert(true);

        // Handle specific errors
        if (
          createData.error &&
          createData.error.includes("identifier already exists")
        ) {
          setIdentifierError("This identifier already exists");
        }

        setTimeout(() => {
          setIsAlert(false);
        }, 5000);
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertDescription("An unexpected error occurred");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {!onOpenChange && (
          <DialogTrigger asChild>
            <Button variant="outline">Create New Organization</Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Fill the form to create a new organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Organization Name"
                value={name}
                onChange={handleNameChange}
              />
              {nameError && <p className="text-sm text-red-500">{nameError}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="identifier">Identifier</Label>
              <Input
                id="identifier"
                placeholder="Organization Identifier"
                value={identifier}
                onChange={handleIdentifierChange}
              />
              {identifierError && (
                <p className="text-sm text-red-500">{identifierError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The identifier must be unique and will be used in URLs.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
