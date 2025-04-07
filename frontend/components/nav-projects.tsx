"use client";

import {
  // Folder,
  // MoreHorizontal,
  // Share,
  // Trash2,
  type LucideIcon,
} from "lucide-react";

import // DropdownMenu,
// DropdownMenuContent,
// DropdownMenuItem,
// DropdownMenuSeparator,
// DropdownMenuTrigger,
"@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  // SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  // useSidebar,
} from "@/components/ui/sidebar";

export function NavProjects({
  projects,
  buttonClicked,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
  buttonClicked: (button: string) => void;
}) {
  // const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Management</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild onClick={() => buttonClicked(item.name)}>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </SidebarMenuItem>
        ))}
        {/* <SidebarMenuItem> */}
        {/* <SidebarMenuButton> */}
        {/* <MoreHorizontal /> */}
        {/* <span>More</span> */}
        {/* </SidebarMenuButton> */}
        {/* </SidebarMenuItem> */}
      </SidebarMenu>
    </SidebarGroup>
  );
}
