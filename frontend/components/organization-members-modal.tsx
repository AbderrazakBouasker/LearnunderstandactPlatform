import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal, Loader2 } from "lucide-react";

interface Member {
  user: {
    _id: string;
    username: string;
    email: string;
  };
  role: string;
  _id: string;
}

interface OrganizationMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationIdentifier: string;
}

export function OrganizationMembersModal({
  open,
  onOpenChange,
  organizationIdentifier,
}: OrganizationMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alert state
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);

  // Prevent clicks inside the modal from closing it
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Fetch members when the modal opens
  useEffect(() => {
    if (open && organizationIdentifier) {
      fetchMembers();
    }
  }, [open, organizationIdentifier]);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/identifier/${organizationIdentifier}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMembers(data.members || []);
      } else {
        setError(data.error || "Failed to fetch organization members");
        setAlertTitle("Error");
        setAlertDescription(
          data.error || "Failed to fetch organization members"
        );
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 5000);
      }
    } catch (error) {
      setError("An unexpected error occurred");
      setAlertTitle("Error");
      setAlertDescription("An unexpected error occurred");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[500px]"
          onClick={handleContentClick}
        >
          <DialogHeader>
            <DialogTitle>Organization Members</DialogTitle>
            <DialogDescription>
              View the members of this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center text-destructive p-4">{error}</div>
            ) : members.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                No members found in this organization.
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div>
                      <p className="font-medium">
                        {member.user?.username || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email || "No email"}
                      </p>
                    </div>
                    <div>
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
