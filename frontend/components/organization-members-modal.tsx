import { Button } from "@/components/ui/button";
import { X, Loader2, UserIcon, Trash2, Terminal } from "lucide-react";
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
  onClose: () => void;
}

export function OrganizationMembersModal({
  organization,
  userData,
  onClose,
}: OrganizationMembersModalProps) {
  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<Member | null>(null);

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
  const isCurrentUserAdmin =
    orgData?.members.some(
      (m) => m.user._id === userData._id && m.role === "admin"
    ) ?? false;

  useEffect(() => {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setAlert({
          title: "Error",
          description: err instanceof Error ? err.message : "An error occurred",
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
  }, [organization.identifier]);

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
          variant={row.original.role === "admin" ? "default" : "outline"}
          className="capitalize"
        >
          {row.original.role}
        </Badge>
      ),
    },
    ...(isCurrentUserAdmin
      ? [
          {
            id: "action",
            header: "Action",
            cell: ({ row }: { row: { original: Member } }) => {
              const member = row.original;
              return member.user._id !== userData._id ? (
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
              ) : null;
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

  return (
    <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-auto p-6 relative flex flex-col items-center justify-center">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 w-full">
        <h2 className="text-lg font-semibold mx-auto text-center flex-1">
          Organization Members
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none ml-2"
          style={{ width: "2.5rem", height: "2.5rem" }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <p className="text-muted-foreground mb-4 text-center w-full">
        Manage members of {organization.name} .
      </p>
      <p className="text-xs text-muted-foreground mb-4 text-center w-full">
        Organization ID: {organization.identifier}
      </p>

      {/* Search and columns - simplified like data-table-feedback */}
      <div className="flex items-center py-2 w-full">
        <Input
          placeholder="Search members..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
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
      {/* Footer */}
      <div className="flex justify-end gap-2 mt-2 w-full">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* AlertDialog for confirmation */}
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
                  onClick={() => handleRemoveMember(confirmUser.user.username)}
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

      {/* Alert notification for errors and responses */}
      {alert.open && (
        <div className="fixed bottom-10 left-0 right-0 flex items-center justify-center z-50">
          <Alert variant={alert.variant}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
