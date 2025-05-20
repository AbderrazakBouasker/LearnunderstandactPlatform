import { Button } from "@/components/ui/button";
import { X, Loader2, UserIcon } from "lucide-react";
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
    </div>
  );
}
