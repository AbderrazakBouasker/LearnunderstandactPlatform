"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { OrganizationCreateModal } from "./organization-create-modal";
import { OrganizationOptionsDroplist } from "./organization-options-droplist";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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

export function TeamSwitcher({
  teams,
  userData,
  onOrganizationChange,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    identifier: string;
    plan: string;
  }[];
  UserData: {
    _id: string;
    username: string;
    email: string;
    organization: string[];
    createdAt: string;
    organizationDetails: OrganizationDetail[];
    id: string;
  };
  onOrganizationChange?: (organization: string) => void;
}) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  const [isOrgModalOpen, setIsOrgModalOpen] = React.useState(false);

  // Call onOrganizationChange with initial team on mount
  React.useEffect(() => {
    if (activeTeam && onOrganizationChange) {
      onOrganizationChange(activeTeam.identifier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this only runs once on mount

  if (!activeTeam) {
    return null;
  }
  // console.log(teams);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <div key={team.name} className="flex items-center">
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => {
                    setActiveTeam(team);
                    onOrganizationChange?.(team.identifier);
                  }}
                  className="flex-1 gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <team.logo className="size-4 shrink-0" />
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
                <OrganizationOptionsDroplist
                  organization={team}
                  userData={userData}
                />
              </div>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setIsOrgModalOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Organization Create Modal */}
      <OrganizationCreateModal
        userData={userData}
        open={isOrgModalOpen}
        onOpenChange={setIsOrgModalOpen}
      />
    </SidebarMenu>
  );
}
