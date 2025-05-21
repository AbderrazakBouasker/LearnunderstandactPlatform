"use client";
import { DataTableForm } from "@/components/data-table-form";
import { CreateFormModal } from "./create-form-modal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useState, useMemo } from "react";
interface Member {
  user: string;
  role: string;
  _id: string;
}

interface OrganizationDetail {
  _id: string;
  name: string;
  identifier: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  organization: string[];
  createdAt: string;
  organizationDetails: OrganizationDetail[]; // Should be OrganizationDetail[]
  id: string;
}

export function Form({
  selectedOrganization,
  userData,
}: {
  selectedOrganization: string;
  userData: UserData;
}) {
  const [isAlert, setIsAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertVariant, setAlertVariant] = useState<"default" | "destructive">(
    "default"
  );

  // Check if user is admin or subadmin in the current organization
  const isAdminOrSubAdmin = useMemo(() => {
    if (!userData || !userData.organizationDetails) return false;

    // Find the current organization in user's organization details
    const currentOrg = userData.organizationDetails.find(
      (org) => org.identifier === selectedOrganization
    );

    if (!currentOrg) return false;

    // Find the current user's membership in the organization
    const userMembership = currentOrg.members.find((member) =>
      typeof member.user === "object"
        ? member.user._id === userData._id
        : member.user === userData._id
    );

    // Check if user has admin or subadmin role
    return (
      userMembership &&
      (userMembership.role === "admin" || userMembership.role === "subadmin")
    );
  }, [userData, selectedOrganization]);

  const handleAlert = (alertInfo: {
    title: string;
    description: string;
    variant: "default" | "destructive";
  }) => {
    setAlertTitle(alertInfo.title);
    setAlertDescription(alertInfo.description);
    setAlertVariant(alertInfo.variant);
    setIsAlert(true);
    setTimeout(() => {
      setIsAlert(false);
    }, 3000);
  };

  return (
    <>
      {/* Only show create form modal if user is admin or subadmin */}
      {isAdminOrSubAdmin && (
        <CreateFormModal
          action="create"
          onAlert={handleAlert}
          selectedOrganization={selectedOrganization}
        />
      )}

      <DataTableForm
        selectedOrganization={selectedOrganization}
        userData={userData} // Fix: renamed from userdata to userData to match expected prop
      />

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
