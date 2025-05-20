import { Button } from "@/components/ui/button";
import { X, Loader2, UserIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";

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

interface Organization {
  _id: string;
  name: string;
  identifier: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface OrganizationMembersModalProps {
  organization: {
    name: string;
    logo: React.ElementType;
    identifier: string;
    plan: string;
  };
  userData: {
    _id: string;
    username: string;
    email: string;
    organization: string[];
    createdAt: string;
    organizationDetails: [];
    id: string;
  };
  onClose: () => void;
}

export function OrganizationMembersModal({
  organization,
  userData,
  onClose,
}: OrganizationMembersModalProps) {
  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<Member | null>(null);

  // Check if current user is admin in this org
  const isCurrentUserAdmin =
    orgData?.members.some(
      (m) => m.user._id === userData._id && m.role === "admin"
    ) ?? false;

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/identifier/${organization.identifier}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch organization data");
        }

        const data = await response.json();
        setOrgData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching organization data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationData();
  }, [organization.identifier]);

  // Remove member handler
  const handleRemoveMember = async (username: string) => {
    if (!orgData) return;
    setRemovingUser(username);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/member/remove`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to remove member");
      }
      setOrgData((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.user.username !== username),
            }
          : prev
      );
    } catch (err) {
      // Optionally show error
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setRemovingUser(null);
      setConfirmUser(null);
    }
  };

  return (
    <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-auto p-6 relative flex flex-col items-center justify-center">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 w-full">
        <h2 className="text-lg font-semibold mx-auto text-center flex-1">
          Organization Members
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none ml-2"
          style={{ width: "2.5rem", height: "2.5rem" }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <p className="text-muted-foreground mb-4 text-center w-full">
        Manage members of {organization.name} .
      </p>
      <p className="text-xs text-muted-foreground mb-4 text-center w-full">
        Organization ID: {organization.identifier}
      </p>
      {/* Content */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading members...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-6">
            Error loading organization members: {error}
          </div>
        ) : orgData?.members && orgData.members.length > 0 ? (
          <div className="border rounded-md overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {isCurrentUserAdmin && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgData.members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>
                      <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {member.user.username}
                      {member.user._id === userData._id && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "admin" ? "default" : "outline"
                        }
                        className="capitalize"
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    {isCurrentUserAdmin && (
                      <TableCell>
                        {member.user._id !== userData._id && (
                          <>
                            <Button
                              size="icon"
                              variant="destructive"
                              disabled={removingUser === member.user.username}
                              onClick={() => setConfirmUser(member)}
                              title="Remove member"
                            >
                              {removingUser === member.user.username ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground border rounded-md p-4">
            No members found in this organization.
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-2 mt-6 w-full">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* AlertDialog for confirmation */}
      {confirmUser && (
        <AlertDialog
          open={!!confirmUser}
          onOpenChange={(open) => !open && setConfirmUser(null)}
        >
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{" "}
                <span className="font-semibold">
                  {confirmUser.user.username}
                </span>{" "}
                from the organization?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmUser(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                asChild
                disabled={removingUser === confirmUser.user.username}
              >
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveMember(confirmUser.user.username)}
                  disabled={removingUser === confirmUser.user.username}
                >
                  {removingUser === confirmUser.user.username ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Remove"
                  )}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
