"use client";

import * as React from "react";
import { Command, Frame, LifeBuoy, PieChart, Send } from "lucide-react";

import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useState } from "react";

// Define interfaces for userData structure
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
  organizationDetails: OrganizationDetail[];
  id: string;
}

const data = {
  user: {
    name: "admin",
    email: "test@mail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navSecondary: [
    {
      title: "Documentation",
      url: "http://localhost:5000/api-docs",
      icon: LifeBuoy,
    },
  ],
  management: [
    {
      name: "Dashboard",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Feedbacks",
      url: "#",
      icon: Frame,
    },
    {
      name: "Forms",
      url: "#",
      icon: Send,
    },
    {
      name: "Insights",
      url: "#",
      icon: Command,
    },
    {
      name: "Recommendation",
      url: "#",
      icon: LifeBuoy,
    },
  ],
};

export function AppSidebar({
  onButtonClick,
  onOrganizationChange,
  userData,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onButtonClick?: (button: string) => void;
  onOrganizationChange?: (organization: string) => void;
  userData?: UserData;
}) {
  const [handleWhichButtonPressed, setHandleWhichButtonPressed] = useState<
    string | null
  >(null);

  const handleButtonClick = (button: string) => {
    setHandleWhichButtonPressed(button);
    // Forward the button click to the parent component
    if (onButtonClick) {
      onButtonClick(button);
    }
  };

  // Memoize the teams array to prevent recalculation on every render
  const teams = React.useMemo(() => {
    return userData?.organizationDetails?.length
      ? userData.organizationDetails.map((org: OrganizationDetail) => ({
          name: org.name,
          logo: Command,
          identifier: org.identifier,
          plan: org.plan,
        }))
      : [
          {
            name: userData?.username ? userData.username + "org" : "LUA App",
            logo: Command,
            identifier: userData?.username
              ? userData.username + "@org"
              : "lua-app",
            plan: "Enterprise",
          },
        ];
  }, [userData]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {userData ? (
          <TeamSwitcher
            teams={teams}
            userData={userData}
            onOrganizationChange={onOrganizationChange}
          />
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        <NavProjects
          projects={data.management}
          UserData={userData}
          buttonClicked={handleButtonClick}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
