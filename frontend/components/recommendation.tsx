"use client";
import { DataTableRecommendation } from "./data-table-recommendation";
interface Member {
  user: string;
  role: string;
  _id: string;
}

interface OrganizationDetail {
  _id: string;
  name: string;
  identifier: string;
  plan: string;
  domains: string[];
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

export function Recommendation({
  selectedOrganization,
  userData,
}: {
  selectedOrganization: string;
  userData: UserData;
}) {
  return (
    <>
      <DataTableRecommendation
        selectedOrganization={selectedOrganization}
        userData={userData}
      />
    </>
  );
}
