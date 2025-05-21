import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Terminal, Loader2, AtSign, User } from "lucide-react";

interface Member {
  user: {
    _id: string;
    username: string;
    email: string;
    id: string;
  };
  role: string;
  _id: string;
}

interface OrganizationMemberAddModalProps {
  organization: {
    name: string;
    logo: React.ElementType;
    identifier: string;
    plan: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded?: (member: Member) => void;
}

export function OrganizationMemberAddModal({
  organization,
  open,
  onOpenChange,
  onMemberAdded,
}: OrganizationMemberAddModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("username");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replace error and success states with unified alert state
  const [isAlert, setIsAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertVariant, setAlertVariant] = useState<"default" | "destructive">(
    "default"
  );

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setIsAlert(false);
  };

  const handleAddMember = async () => {
    setIsSubmitting(true);
    setIsAlert(false);

    try {
      // Determine which data to send based on active tab
      const endpoint =
        activeTab === "username"
          ? `/api/organization/${organization.identifier}/member/add/username`
          : `/api/organization/${organization.identifier}/member/add/email`;

      const payload =
        activeTab === "username"
          ? { username: username.trim() }
          : { email: email.trim() };

      // Validation
      if (!Object.values(payload)[0]) {
        throw new Error(`Please enter a valid ${activeTab}`);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases based on status code
        switch (response.status) {
          case 404:
            // User or organization not found
            throw new Error(
              data.error || `No user found with this ${activeTab}`
            );
          case 400:
            // User is already a member
            throw new Error(
              data.error || "User is already a member of this organization"
            );
          case 403:
            // Permission denied
            throw new Error(
              data.error || "You don't have permission to add members"
            );
          default:
            throw new Error(
              data.error || `Failed to add member by ${activeTab}`
            );
        }
      }

      // Success alert
      setAlertTitle("Success");
      setAlertDescription(`Member added successfully to ${organization.name}`);
      setAlertVariant("default");
      setIsAlert(true);

      // FIXED: Always call onMemberAdded callback on success, even if data.member doesn't exist
      if (onMemberAdded) {
        // If data.member exists, pass it, otherwise just call the callback with no argument
        if (data.member) {
          onMemberAdded(data.member);
        } else {
          // Call without data to trigger the refetch
          onMemberAdded();
        }
      }

      // Reset form after success
      setUsername("");
      setEmail("");

      // Auto-close after successful addition
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 2000);
    } catch (err) {
      // Error alert
      setAlertTitle("Error");
      setAlertDescription(
        err instanceof Error ? err.message : "An error occurred"
      );
      setAlertVariant("destructive");
      setIsAlert(true);

      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If modal is not open, don't render anything
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => {
        onOpenChange(false);
        resetForm();
      }}
    >
      <div
        className="bg-background rounded-lg shadow-lg max-w-md w-full mx-auto p-6 relative flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 w-full">
          <h2 className="text-lg font-semibold mx-auto text-center flex-1">
            Add Member to {organization.name}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none ml-2"
            style={{ width: "2.5rem", height: "2.5rem" }}
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-muted-foreground mb-4 text-center w-full">
          Invite a new member to join your organization.
        </p>

        <Tabs
          defaultValue="username"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="username" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              By Username
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1">
              <AtSign className="h-4 w-4" />
              By Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="username" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          className="w-full mt-4"
          onClick={handleAddMember}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>Add Member</>
          )}
        </Button>
      </div>

      {/* Alert notification for errors and responses (moved outside the modal content) */}
      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0 z-50">
          <Alert variant={alertVariant}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
