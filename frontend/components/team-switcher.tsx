"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Settings } from "lucide-react";
import { OrganizationCreateModal } from "./organization-create-modal";
import { OrganizationMembersModal } from "./organization-members-modal";

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
import { Button } from "@/components/ui/button";

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
  const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Call onOrganizationChange with initial team on mount
  React.useEffect(() => {
    if (activeTeam && onOrganizationChange) {
      onOrganizationChange(activeTeam.identifier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this only runs once on mount

  // Handle opening the members modal
  const handleOpenMembersModal = React.useCallback((team: any) => {
    // Close the dropdown first
    setIsDropdownOpen(false);
    // Set the active team to the selected one
    setActiveTeam(team);
    // Open the members modal after a short delay to ensure dropdown has closed
    setTimeout(() => setIsMembersModalOpen(true), 100);
  }, []);

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMembersModal(team);
                  }}
                >
                  <span className="sr-only">Team settings</span>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                setIsDropdownOpen(false);
                setTimeout(() => setIsOrgModalOpen(true), 100);
              }}
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

      {/* Organization Members Modal */}
      <OrganizationMembersModal
        organization={activeTeam}
        userData={userData}
        open={isMembersModalOpen}
        onOpenChange={setIsMembersModalOpen}
      />
    </SidebarMenu>
  );
}
