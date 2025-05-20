"use client";

import {
  // BadgeCheck,
  // Bell,
  ChevronsUpDown,
  // CreditCard,
  LogOut,
  User,
  Terminal,
  // Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  // DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useRouter } from "next/navigation";
import { ProfileModal } from "./profile-modal";

export function NavUser({
  user,
}: {
  user: {
    _id: string;
    username: string;
    email: string;
    organization: string[];
    createdAt: string;
    organizationDetails: [];
    id: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [userData, setUserData] = useState(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  function handleProfile() {
    setIsProfileModalOpen(true);
  }

  async function handleLogout() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/auth/logout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    if (response.ok) {
      setAlertDescription("Logout successful");
      setAlertTitle("Success");
      setAlertVariant("default");
      setIsAlert(true);
      router.push("/admin/login");
    } else {
      setAlertDescription("Logout failed");
      setAlertTitle("Error");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    }
  }

  // Handle profile updates
  const handleProfileUpdate = (updatedData: {
    username?: string;
    email?: string;
  }) => {
    setUserData((prevData) => {
      if (!prevData) return { ...user, ...updatedData };
      return { ...prevData, ...updatedData };
    });
  };

  useEffect(() => {
    setUserData(user);
  }, [user]);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {userData?.username
                      ? userData.username.substring(0, 2).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {userData?.username || "User"}
                  </span>
                  <span className="truncate text-xs">
                    {userData?.email || "Loading..."}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {userData?.username
                        ? userData.username.substring(0, 2).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {userData?.username || "User"}
                    </span>
                    <span className="truncate text-xs">
                      {userData?.email || "Loading..."}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleProfile}>
                  <User />
                  Edit Profile
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0">
          <Alert variant={alertVariant}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* Custom modal implementation */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setIsProfileModalOpen(false)}
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="relative z-60" onClick={(e) => e.stopPropagation()}>
            <ProfileModal
              open={isProfileModalOpen}
              onOpenChange={setIsProfileModalOpen}
              userData={userData}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
        </div>
      )}
    </>
  );
}
