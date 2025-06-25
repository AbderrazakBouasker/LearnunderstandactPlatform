import { Button } from "@/components/ui/button";
import {
  Loader2,
  UserIcon,
  Trash2,
  Terminal,
  UserPlus,
  Settings,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { OrganizationMemberAddModal } from "./organization-member-add-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganizationUpgradeStripeModal } from "./organization-upgrade-stripe-modal";
import { X as XIcon } from "lucide-react";

interface Member {
  user: {
    _id: string;
    username: string;
    email: string;
    id: string;
  };
  role: string;
  _id: string;
}

interface Organization {
  _id: string;
  name: string;
  identifier: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  domains?: string[]; // Add domains property
  recommendationThreshold?: number;
  ticketCreationDelay?: number;
  notificationThreshold?: number;
  jiraConfig?: {
    host?: string;
    username?: string;
    apiToken?: string;
    projectKey?: string;
    issueType?: string;
    enabled?: boolean;
  };
}

interface OrganizationMembersModalProps {
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLAN_DOMAIN_LIMITS = {
  Free: 1,
  Pro: 2,
  Enterprise: 3, // Assuming Enterprise has a limit of 3 as per request
  // Add other plans if they exist
};

export function OrganizationSettingsModal({
  organization,
  userData,
  open,
  onOpenChange,
}: OrganizationMembersModalProps) {
  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<Member | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberAddedTrigger, setMemberAddedTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("members");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedOrgName, setEditedOrgName] = useState(organization.name);
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isQuittingOrg, setIsQuittingOrg] = useState(false);
  const [isQuitDialogOpen, setIsQuitDialogOpen] = useState(false);
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // State variables for domain management
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [isDeletingDomain, setIsDeletingDomain] = useState<string | null>(null);

  // State variables for recommendation settings
  const [recommendationThreshold, setRecommendationThreshold] = useState(0.5);
  const [ticketCreationDelay, setTicketCreationDelay] = useState(7);
  const [notificationThreshold, setNotificationThreshold] = useState(0.7);
  const [jiraHost, setJiraHost] = useState("");
  const [jiraUsername, setJiraUsername] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraIssueType, setJiraIssueType] = useState("Task");
  const [jiraEnabled, setJiraEnabled] = useState(false);
  const [isUpdatingRecommendations, setIsUpdatingRecommendations] =
    useState(false);
  const [isUpdatingJira, setIsUpdatingJira] = useState(false);

  // Alert state for notifications and errors
  const [alert, setAlert] = useState<{
    title: string;
    description: string;
    variant: "default" | "destructive";
    open: boolean;
  }>({ title: "", description: "", variant: "default", open: false });

  // Table state
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // Pagination state
  const [rowSelection, setRowSelection] = useState({});

  // Check if current user is admin in this org
  const isCurrentUserAdminOrSubadmin =
    orgData?.members.some(
      (m) =>
        m.user._id === userData._id &&
        (m.role === "admin" || m.role === "subadmin")
    ) ?? false;

  // Keep the original admin check for organization-level admin operations
  const isCurrentUserAdmin =
    orgData?.members.some(
      (m) => m.user._id === userData._id && m.role === "admin"
    ) ?? false;

  const currentPlanLimit =
    PLAN_DOMAIN_LIMITS[organization.plan as keyof typeof PLAN_DOMAIN_LIMITS] ??
    0;
  const canAddMoreDomains = domains.length < currentPlanLimit;

  useEffect(() => {
    if (open) {
      const fetchOrganizationData = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/identifier/${organization.identifier}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data?.error || "Failed to fetch organization data");
          }

          const data = await response.json();
          setOrgData(data);

          // Initialize domains from organization data
          if (data.domains) {
            setDomains(data.domains);
          } else {
            setDomains([]); // Ensure domains is an empty array if not present
          }

          // Initialize recommendation settings from organization data
          setRecommendationThreshold(data.recommendationThreshold ?? 0.5);
          setTicketCreationDelay(data.ticketCreationDelay ?? 7);
          setNotificationThreshold(data.notificationThreshold ?? 0.7);

          // Initialize Jira settings from organization data
          if (data.jiraConfig) {
            setJiraHost(data.jiraConfig.host ?? "");
            setJiraUsername(data.jiraConfig.username ?? "");
            setJiraApiToken(data.jiraConfig.apiToken ?? "");
            setJiraProjectKey(data.jiraConfig.projectKey ?? "");
            setJiraIssueType(data.jiraConfig.issueType ?? "Task");
            setJiraEnabled(data.jiraConfig.enabled ?? false);
          } else {
            setJiraHost("");
            setJiraUsername("");
            setJiraApiToken("");
            setJiraProjectKey("");
            setJiraIssueType("Task");
            setJiraEnabled(false);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setAlert({
            title: "Error",
            description:
              err instanceof Error ? err.message : "An error occurred",
            variant: "destructive",
            open: true,
          });
          // eslint-disable-next-line no-console
          console.error("Error fetching organization data:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrganizationData();
    }
  }, [organization.identifier, open, memberAddedTrigger]); // Add memberAddedTrigger to dependencies

  // Remove member handler
  const handleRemoveMember = async (username: string) => {
    if (!orgData) return;
    setRemovingUser(username);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/member/remove`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to remove member");
      }
      setOrgData((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.user.username !== username),
            }
          : prev
      );
      setAlert({
        title: "Success",
        description: "User removed from organization successfully",
        variant: "default",
        open: true,
      });
    } catch (err) {
      setAlert({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to remove member",
        variant: "destructive",
        open: true,
      });
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setRemovingUser(null);
      setConfirmUser(null);
    }
  };

  // Auto-close alert after 3 seconds
  useEffect(() => {
    if (alert.open) {
      const timeout = setTimeout(() => {
        setAlert((prev) => ({ ...prev, open: false }));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [alert.open]);

  // Add handler for organization deletion
  const handleDeleteOrganization = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        setAlert({
          title: "Success",
          description: "Organization deleted successfully",
          variant: "default",
          open: true,
        });

        // Close dialogs
        setIsDeleteDialogOpen(false);

        // Wait a moment before redirecting to show the success message
        setTimeout(() => {
          onOpenChange(false);
          // Redirect to admin dashboard or refresh the page to update the team list
          window.location.href = "/admin";
        }, 2000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete organization");
      }
    } catch (err) {
      setAlert({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
        open: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Update editedOrgName when organization changes
  useEffect(() => {
    setEditedOrgName(organization.name);
  }, [organization.name]);

  // Handle organization edit
  const handleEditOrganization = async () => {
    if (!isCurrentUserAdmin) return;

    setIsEditingOrg(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/edit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: editedOrgName }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update organization data locally
        if (orgData) {
          setOrgData({
            ...orgData,
            name: editedOrgName,
          });
        }

        setAlert({
          title: "Success",
          description: "Organization updated successfully",
          variant: "default",
          open: true,
        });

        // Wait a moment before reloading to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Handle specific error status codes
        switch (response.status) {
          case 404:
            throw new Error(
              "Organization not found. It may have been deleted."
            );
          case 403:
            throw new Error(
              "You don't have permission to update this organization."
            );
          default:
            throw new Error(data.error || "Failed to update organization");
        }
      }
    } catch (err) {
      setAlert({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
        open: true,
      });

      // Log error to console for debugging
      console.error("Error updating organization:", err);
    } finally {
      setIsEditingOrg(false);
    }
  };

  // Domain management functions
  const handleAddDomain = async () => {
    if (!newDomain.trim() || !isCurrentUserAdminOrSubadmin) return;

    if (!canAddMoreDomains) {
      setAlert({
        title: "Limit Reached",
        description: `Your current plan (${organization.plan}) allows a maximum of ${currentPlanLimit} domain(s). Please upgrade to add more.`,
        variant: "destructive",
        open: true,
      });
      return;
    }

    setIsAddingDomain(true);
    try {
      const updatedDomains = [...domains, newDomain.trim()];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/edit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ domains: updatedDomains }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDomains(updatedDomains);
        setNewDomain("");
        setAlert({
          title: "Success",
          description: "Domain added successfully",
          variant: "default",
          open: true,
        });
      } else {
        throw new Error(data.error || "Failed to add domain");
      }
    } catch (err) {
      setAlert({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
        open: true,
      });
      console.error("Error adding domain:", err);
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainToRemove: string) => {
    if (!isCurrentUserAdminOrSubadmin) return;

    setIsDeletingDomain(domainToRemove);
    try {
      const updatedDomains = domains.filter((d) => d !== domainToRemove);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/edit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ domains: updatedDomains }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDomains(updatedDomains);
        setAlert({
          title: "Success",
          description: "Domain removed successfully",
          variant: "default",
          open: true,
        });
      } else {
        throw new Error(data.error || "Failed to remove domain");
      }
    } catch (err) {
      setAlert({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
        open: true,
      });
      console.error("Error removing domain:", err);
    } finally {
      setIsDeletingDomain(null);
    }
  };

  // Handle quitting organization (for non-admin users)
  const handleQuitOrganization = async () => {
    setIsQuittingOrg(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/member/remove`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username: userData.username }),
        }
      );

      if (response.ok) {
        setAlert({
          title: "Success",
          description: "You have left the organization successfully",
          variant: "default",
          open: true,
        });

        // Close dialogs
        setIsQuitDialogOpen(false);

        // Wait a moment before redirecting to show the success message
        setTimeout(() => {
          onOpenChange(false);
          // Redirect to admin dashboard or refresh the page to update the team list
          window.location.href = "/admin";
        }, 2000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave the organization");
      }
    } catch (err) {
      setAlert({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
        open: true,
      });
    } finally {
      setIsQuittingOrg(false);
    }
  };

  // Handle role change (promotion/demotion)
  const handleRoleToggle = async (username: string) => {
    if (!orgData || !isCurrentUserAdmin) return;

    setChangingRoleFor(username);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/member/change-role`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to change member role");
      }

      // Update local data with the new role
      setOrgData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          members: prev.members.map((member) => {
            if (member.user.username === username) {
              // Toggle role between user and subadmin
              const newRole = member.role === "user" ? "subadmin" : "user";
              return {
                ...member,
                role: newRole,
              };
            }
            return member;
          }),
        };
      });

      setAlert({
        title: "Success",
        description: "Member role updated successfully",
        variant: "default",
        open: true,
      });
    } catch (err) {
      setAlert({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to change member role",
        variant: "destructive",
        open: true,
      });
      console.error("Error changing role:", err);
    } finally {
      setChangingRoleFor(null);
    }
  };

  // Handle recommendation settings update
  const handleUpdateRecommendationSettings = async () => {
    if (!isCurrentUserAdminOrSubadmin) return;

    setIsUpdatingRecommendations(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/edit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            recommendationThreshold,
            ticketCreationDelay,
            notificationThreshold,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAlert({
          title: "Success",
          description: "Recommendation settings updated successfully",
          variant: "default",
          open: true,
        });
      } else {
        throw new Error(
          data.error || "Failed to update recommendation settings"
        );
      }
    } catch (err) {
      setAlert({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
        open: true,
      });
      console.error("Error updating recommendation settings:", err);
    } finally {
      setIsUpdatingRecommendations(false);
    }
  };

  // Handle Jira settings update
  const handleUpdateJiraSettings = async () => {
    if (!isCurrentUserAdminOrSubadmin) return;

    // Validate required fields when Jira is enabled
    if (jiraEnabled) {
      if (
        !jiraHost.trim() ||
        !jiraUsername.trim() ||
        !jiraApiToken.trim() ||
        !jiraProjectKey.trim()
      ) {
        setAlert({
          title: "Validation Error",
          description:
            "All Jira fields (Host, Username, API Token, Project Key) are required when Jira integration is enabled.",
          variant: "destructive",
          open: true,
        });
        return;
      }
    }

    setIsUpdatingJira(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/organization/${organization.identifier}/edit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            jiraConfig: {
              host: jiraHost,
              username: jiraUsername,
              apiToken: jiraApiToken,
              projectKey: jiraProjectKey,
              issueType: jiraIssueType,
              enabled: jiraEnabled,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAlert({
          title: "Success",
          description: "Jira settings updated successfully",
          variant: "default",
          open: true,
        });
      } else {
        throw new Error(data.error || "Failed to update Jira settings");
      }
    } catch (err) {
      setAlert({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
        open: true,
      });
      console.error("Error updating Jira settings:", err);
    } finally {
      setIsUpdatingJira(false);
    }
  };

  // Table columns
  const columns: ColumnDef<Member>[] = [
    {
      id: "avatar",
      header: "",
      cell: () => (
        <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground">
          <UserIcon className="h-4 w-4" />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "user.username",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <span className="font-medium">
            {member.user.username}
            {member.user._id === userData._id && (
              <span className="ml-2 text-xs text-muted-foreground">(You)</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "user.email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.user.email,
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.role === "admin"
              ? "default"
              : row.original.role === "subadmin"
              ? "secondary"
              : "outline"
          }
          className="capitalize"
        >
          {row.original.role}
        </Badge>
      ),
    },
    ...(isCurrentUserAdminOrSubadmin
      ? [
          {
            id: "action",
            header: "Action",
            cell: ({ row }: { row: { original: Member } }) => {
              const member = row.original;
              // Don't allow actions on yourself or on admins if you're not an admin
              const canActOnMember =
                member.user._id !== userData._id &&
                !(member.role === "admin" && !isCurrentUserAdmin);

              // Only admins can change roles and only for non-admin members
              const canChangeRole =
                isCurrentUserAdmin &&
                member.role !== "admin" &&
                member.user._id !== userData._id;

              return (
                <div className="flex space-x-1">
                  {canChangeRole && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={changingRoleFor === member.user.username}
                      onClick={() => handleRoleToggle(member.user.username)}
                      title={
                        member.role === "user"
                          ? "Promote to Subadmin"
                          : "Demote to User"
                      }
                    >
                      {changingRoleFor === member.user.username ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : member.role === "user" ? (
                        "Promote"
                      ) : (
                        "Demote"
                      )}
                    </Button>
                  )}

                  {canActOnMember && (
                    <Button
                      size="icon"
                      variant="destructive"
                      disabled={removingUser === member.user.username}
                      onClick={() => setConfirmUser(member)}
                      title="Remove member"
                    >
                      {removingUser === member.user.username ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            },
            enableSorting: false,
            enableHiding: false,
          },
        ]
      : []),
  ];

  // Table instance
  const table = useReactTable({
    data: orgData?.members || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, filterValue) => {
      // Search in all fields
      const member = row.original as Member;
      const value =
        member.user.username + " " + member.user.email + " " + member.role;
      return value.toLowerCase().includes(String(filterValue).toLowerCase());
    },
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // If modal is not open, don't render anything
  if (!open) return null;

  // Add the implementation for the Settings tab with the upgrade button
  const renderPlanWithUpgradeButton = () => {
    return (
      <div className="grid gap-1">
        <Label htmlFor="org-plan">Plan</Label>
        <div className="flex gap-2">
          <Input
            id="org-plan"
            value={organization.plan}
            readOnly
            disabled
            className="flex-1"
          />
          {isCurrentUserAdminOrSubadmin &&
            (organization.plan === "Free" || organization.plan === "Pro") && (
              <Button
                onClick={() => setIsUpgradeModalOpen(true)}
                variant="outline"
              >
                Upgrade
              </Button>
            )}
        </div>
      </div>
    );
  };

  // Add domain management UI
  const renderDomainSection = () => {
    return (
      <div className="space-y-2 mt-6">
        <h3 className="text-lg font-medium">Allowed Embed Domains</h3>
        <p className="text-sm text-muted-foreground">
          Domains where your forms can be embedded. If empty, forms cannot be
          embedded anywhere.
        </p>
        <p className="text-xs text-muted-foreground">
          Your current plan ({organization.plan}) allows up to{" "}
          {currentPlanLimit} domain(s). You have added {domains.length}.
        </p>

        {isCurrentUserAdminOrSubadmin && (
          <div className="flex gap-2 items-center mb-2">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex-1"
              disabled={isAddingDomain || !canAddMoreDomains}
            />
            <Button
              onClick={handleAddDomain}
              disabled={
                !newDomain.trim() || isAddingDomain || !canAddMoreDomains
              }
              variant="outline"
            >
              {isAddingDomain ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
        {!canAddMoreDomains && isCurrentUserAdminOrSubadmin && (
          <p className="text-sm text-red-500">
            You have reached the maximum number of domains for your plan.
            {organization.plan !== "Enterprise" && ( // Assuming Enterprise is the highest tier shown here
              <Button
                variant="link"
                className="p-1 h-auto"
                onClick={() => setIsUpgradeModalOpen(true)}
              >
                Upgrade plan
              </Button>
            )}
          </p>
        )}

        <div className="border rounded-md p-2 min-h-[100px] max-h-[200px] overflow-y-auto">
          {domains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <div
                  key={domain}
                  className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                >
                  {domain}
                  {isCurrentUserAdminOrSubadmin && (
                    <button
                      onClick={() => handleRemoveDomain(domain)}
                      className="text-muted-foreground hover:text-red-500 focus:outline-none"
                      disabled={isDeletingDomain === domain}
                    >
                      {isDeletingDomain === domain ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XIcon className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No domains added. Forms cannot be embedded anywhere.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Add recommendation settings UI (only for Enterprise plan)
  const renderRecommendationSettings = () => {
    if (organization.plan !== "Enterprise") {
      return null;
    }

    return (
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">Recommendation Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure AI recommendations and ticket creation settings for your
          organization.
        </p>

        {/* Recommendation Settings */}
        <div className="space-y-4 border rounded-md p-4">
          <h4 className="text-md font-medium">Recommendation Configuration</h4>

          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="recommendation-threshold">
                Recommendation Threshold (
                {Math.round(recommendationThreshold * 100)}%)
              </Label>
              <input
                type="range"
                id="recommendation-threshold"
                min="0"
                max="1"
                step="0.05"
                value={recommendationThreshold}
                onChange={(e) =>
                  setRecommendationThreshold(parseFloat(e.target.value))
                }
                disabled={!isCurrentUserAdminOrSubadmin}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Threshold of negative feedback score for AI recommendation to be
                made (10% - 100%)
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="ticket-creation-delay">
                Ticket Creation Delay (days)
              </Label>
              <Input
                id="ticket-creation-delay"
                type="number"
                min="1"
                max="365"
                value={ticketCreationDelay}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setTicketCreationDelay(Math.min(365, Math.max(1, value)));
                }}
                disabled={!isCurrentUserAdminOrSubadmin}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Delay in days since the last one before creating a new ticket
                for insights (1-365 days)
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="notification-threshold">
                Notification Threshold (
                {Math.round(notificationThreshold * 100)}%)
              </Label>
              <input
                type="range"
                id="notification-threshold"
                min="0"
                max="1"
                step="0.05"
                value={notificationThreshold}
                onChange={(e) =>
                  setNotificationThreshold(parseFloat(e.target.value))
                }
                disabled={!isCurrentUserAdminOrSubadmin}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Threshold of negative feedback score for sending notifications
                (10% - 100%)
              </p>
            </div>

            {isCurrentUserAdminOrSubadmin && (
              <Button
                onClick={handleUpdateRecommendationSettings}
                disabled={isUpdatingRecommendations}
                className="w-fit"
              >
                {isUpdatingRecommendations ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Recommendation Settings"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Jira Settings */}
        <div className="space-y-4 border rounded-md p-4">
          <h4 className="text-md font-medium">Jira Integration</h4>

          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="jira-enabled">Integration Status</Label>
              <Select
                value={jiraEnabled ? "enabled" : "disabled"}
                onValueChange={(value) => setJiraEnabled(value === "enabled")}
                disabled={!isCurrentUserAdminOrSubadmin}
              >
                <SelectTrigger id="jira-enabled">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Enable or disable Jira integration for this organization
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="jira-host">Jira Host</Label>
              <Input
                id="jira-host"
                type="url"
                placeholder="https://your-domain.atlassian.net"
                value={jiraHost}
                onChange={(e) => setJiraHost(e.target.value)}
                disabled={!isCurrentUserAdminOrSubadmin}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="jira-username">Jira Username</Label>
              <Input
                id="jira-username"
                type="email"
                placeholder="your-email@domain.com"
                value={jiraUsername}
                onChange={(e) => setJiraUsername(e.target.value)}
                disabled={!isCurrentUserAdminOrSubadmin}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="jira-api-token">API Token</Label>
              <Input
                id="jira-api-token"
                type="password"
                placeholder="Your Jira API token"
                value={jiraApiToken === "***HIDDEN***" ? "" : jiraApiToken}
                onChange={(e) => setJiraApiToken(e.target.value)}
                disabled={!isCurrentUserAdminOrSubadmin}
              />
              <p className="text-xs text-muted-foreground">
                Generate an API token from your Jira account settings
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="jira-project-key">Project Key</Label>
              <Input
                id="jira-project-key"
                placeholder="PROJ"
                value={jiraProjectKey}
                onChange={(e) => setJiraProjectKey(e.target.value)}
                disabled={!isCurrentUserAdminOrSubadmin}
              />
              <p className="text-xs text-muted-foreground">
                The key of the Jira project where tickets will be created
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="jira-issue-type">Issue Type</Label>
              <Input
                id="jira-issue-type"
                placeholder="Task"
                value={jiraIssueType}
                onChange={(e) => setJiraIssueType(e.target.value)}
                disabled={true}
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Issue type is fixed as &quot;Task&quot; for all Jira
                integrations
              </p>
            </div>

            {isCurrentUserAdminOrSubadmin && (
              <Button
                onClick={handleUpdateJiraSettings}
                disabled={isUpdatingJira}
                className="w-fit"
              >
                {isUpdatingJira ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Jira Settings"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" // Added padding here for small screens
      onClick={() => onOpenChange(false)} // Close when clicking the overlay
    >
      <div
        className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-auto p-6 relative flex flex-col max-h-[calc(100vh-40px)] overflow-y-auto" // Added max-h and overflow-y
        onClick={(e) => e.stopPropagation()} // Prevent clicks on the modal content from closing it
      >
        {/* Header */}
        <div className="flex items-center relative mb-4 w-full h-10">
          {" "}
          {/* Adjusted: Removed justify-between, added relative and min-height (e.g. h-10 or rely on button height) */}
          <h2 className="text-lg font-semibold text-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {" "}
            {/* Adjusted: Absolute centering, removed mx-auto & flex-1 */}
            Organization Settings
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none ml-auto" // Adjusted: Added ml-auto, removed explicit ml-2
            style={{ width: "2.5rem", height: "2.5rem" }}
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-muted-foreground mb-4 text-center w-full">
          Manage {organization.name}
        </p>

        {/* Tabs */}
        <Tabs
          defaultValue="members"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="members" className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Members Tab Content */}
          <TabsContent value="members" className="space-y-4">
            <p className="text-xs text-muted-foreground mb-4 w-full">
              Organization ID: {organization.identifier}
            </p>

            {/* Search and columns - with add member button */}
            <div className="flex items-center py-2 w-full">
              <Input
                placeholder="Search members..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
              />

              {isCurrentUserAdminOrSubadmin && (
                <Button
                  variant="outline"
                  className="ml-2 gap-1"
                  onClick={() => setIsAddMemberModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Table */}
            <div className="border rounded-md overflow-auto max-h-[400px] w-full">
              <Table className="w-full">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="break-words">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="break-words whitespace-normal"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </TabsContent>

          {/* Settings Tab Content */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Organization Information
                </h3>
                <div className="grid gap-1">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="org-name"
                      value={editedOrgName}
                      onChange={(e) => setEditedOrgName(e.target.value)}
                      disabled={!isCurrentUserAdmin || isEditingOrg}
                      className="flex-1"
                    />
                    {isCurrentUserAdmin && (
                      <Button
                        onClick={handleEditOrganization}
                        disabled={
                          isEditingOrg ||
                          editedOrgName === organization.name ||
                          !editedOrgName.trim()
                        }
                      >
                        {isEditingOrg ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="org-id">Organization ID</Label>
                  <Input
                    id="org-id"
                    value={organization.identifier}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Organization ID cannot be changed
                  </p>
                </div>
                {/* Replace the plan input with our new function */}
                {renderPlanWithUpgradeButton()}

                {renderDomainSection()}

                {renderRecommendationSettings()}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Danger Zone</h3>
                <div className="border border-red-200 rounded-md p-4 bg-red-50 dark:bg-red-900/10">
                  {isCurrentUserAdmin ? (
                    // Admin sees Delete Organization option
                    <>
                      <h4 className="font-medium text-red-600 dark:text-red-400">
                        Delete Organization
                      </h4>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-3">
                        Once you delete an organization, there is no going back.
                        Please be certain.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        Delete {organization.name}
                      </Button>
                    </>
                  ) : (
                    // Non-admins see Quit Organization option
                    <>
                      <h4 className="font-medium text-red-600 dark:text-red-400">
                        Quit Organization
                      </h4>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-3">
                        You will lose access to this organization&apos;s
                        resources.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsQuitDialogOpen(true)}
                      >
                        Leave {organization.name}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* AlertDialog for confirmation - outside tabs */}
        {confirmUser && (
          <AlertDialog
            open={!!confirmUser}
            onOpenChange={(open) => !open && setConfirmUser(null)}
          >
            <AlertDialogOverlay />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove{" "}
                  <span className="font-semibold">
                    {confirmUser.user.username}
                  </span>{" "}
                  from the organization?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmUser(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  asChild
                  disabled={removingUser === confirmUser.user.username}
                >
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleRemoveMember(confirmUser.user.username)
                    }
                    disabled={removingUser === confirmUser.user.username}
                  >
                    {removingUser === confirmUser.user.username ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Member Add Modal - outside tabs */}
        <OrganizationMemberAddModal
          organization={organization}
          open={isAddMemberModalOpen}
          onOpenChange={setIsAddMemberModalOpen}
          onMemberAdded={() => {
            // When a member is added, increment the trigger to cause a refetch
            setMemberAddedTrigger((prev) => prev + 1);

            // Show success alert to user
            setAlert({
              title: "Success",
              description: "Member added successfully",
              variant: "default",
              open: true,
            });
          }}
        />

        {/* Delete Organization Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogOverlay />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  <span className="font-semibold"> {organization.name} </span>
                  organization and remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteOrganization}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Organization"
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Quit Organization Confirmation Dialog */}
        {isQuitDialogOpen && (
          <AlertDialog
            open={isQuitDialogOpen}
            onOpenChange={setIsQuitDialogOpen}
          >
            <AlertDialogOverlay />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Organization</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave{" "}
                  <span className="font-semibold">{organization.name}</span>?
                  You will lose access to all resources associated with this
                  organization.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    onClick={handleQuitOrganization}
                    disabled={isQuittingOrg}
                  >
                    {isQuittingOrg ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Leaving...
                      </>
                    ) : (
                      "Leave Organization"
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Add the Upgrade Modal */}
        <OrganizationUpgradeStripeModal
          open={isUpgradeModalOpen}
          onOpenChange={setIsUpgradeModalOpen}
          organization={organization}
          username={userData.username}
        />
      </div>

      {/* Alert notification for errors and responses */}
      {alert.open && (
        <div
          className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0"
          onClick={(e) => e.stopPropagation()} // Prevent alert clicks from closing the modal
        >
          <Alert variant={alert.variant}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* AlertDialog should remain outside this click hierarchy */}
    </div>
  );
}
