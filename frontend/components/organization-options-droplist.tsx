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
import { OrganizationMembersModal } from "./organization-members-modal";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

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
  //   const [isModalOpen, setIsModalOpen] = useState(false);
  //   const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  //   // This function correctly handles the members button click
  //   const handleMembersClick = () => {
  //     // Close dropdown first
  //     setIsDropdownOpen(false);

  //     // Open modal with a slight delay to ensure dropdown is closed
  //     setTimeout(() => {
  //       setIsModalOpen(true);
  //     }, 100);
  //   };
  const [openMembersModal, setOpenMembersModal] = useState(false);
  return (
    <>
      <DropdownMenu>
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
            {/* <Dialog> */}
            {/* <DialogTrigger asChild> */}
            {/* <Button variant="outline">Edit Profile</Button> */}
            {/* <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Members
                  <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DialogTrigger>
              <OrganizationMembersModal />
            </Dialog> */}
            <DropdownMenuItem onSelect={() => setOpenMembersModal(true)}>
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
      <Dialog open={openMembersModal} onOpenChange={setOpenMembersModal}>
        <OrganizationMembersModal
          organization={organization}
          userData={userData}
        />
      </Dialog>
    </>
  );
}
