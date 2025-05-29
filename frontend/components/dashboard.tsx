"use client";

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
export function Dashboard({
  selectedOrganization,
  userData,
}: {
  selectedOrganization: string;
  userData: UserData;
}) {
  return (
    <>
      <p className="text-2xl font-bold mb-4">Dashboard</p>
    </>
  );
}
