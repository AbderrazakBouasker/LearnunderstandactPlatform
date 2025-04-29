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
  // SidebarMenu,
  // SidebarMenuButton,
  // SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState } from "react";

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
  ],
};

export function AppSidebar({
  onButtonClick,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onButtonClick?: (button: string) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {/* <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">LUA App</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu> */}
        <TeamSwitcher
          teams={[
            {
              name: "LUA App",
              logo: Command,
              plan: "Enterprise",
            },
            {
              name: "LUA App2",
              logo: Command,
              plan: "Enterprise2",
            },
          ]}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects
          projects={data.management}
          buttonClicked={handleButtonClick}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
