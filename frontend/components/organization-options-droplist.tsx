import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { OrganizationMembersModal } from "./organization-settings-modal";
import { useState } from "react";
import { createPortal } from "react-dom";

export function OrganizationOptionsDroplist({
  organization,
  userData,
}: {
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
}) {
  const [openMembersModal, setOpenMembersModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Organization Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                setDropdownOpen(false); // Close dropdown
                setTimeout(() => setOpenMembersModal(true), 100); // Open modal after dropdown closes
              }}
            >
              Members
              <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Delete
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Simplified modal portal without pointer-events manipulation */}
      {openMembersModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setOpenMembersModal(false)}
          >
            <div
              className="relative z-60 w-full max-w-2xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <OrganizationMembersModal
                organization={organization}
                userData={userData}
                onClose={() => setOpenMembersModal(false)}
              />
            </div>
          </div>,
          typeof window !== "undefined" ? document.body : (null as any)
        )}
    </>
  );
}
