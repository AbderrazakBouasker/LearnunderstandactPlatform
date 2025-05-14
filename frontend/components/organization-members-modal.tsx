import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal, Loader2, UserMinus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Alert state
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);

  // Prevent modal from closing when clicked inside
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
    // Fetch members logic
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onClick={handleContentClick}>
        <DialogHeader>
          <DialogTitle>Organization Members</DialogTitle>
          <DialogDescription>
            View the members of this organization.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{/* Members list and other content */}</div>
      </DialogContent>
    </Dialog>
  );
}
