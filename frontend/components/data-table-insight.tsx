"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Terminal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FeedbackDetailModal } from "@/components/feedback-detail-modal";
import { FormDetailModal } from "@/components/form-detail-modal";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InsightDetailModal } from "@/components/insight-detail-modal";

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
  organizationDetails: OrganizationDetail[]; // Should be OrganizationDetail[]
  id: string;
}

export type Insight = {
  _id: string;
  feedbackId: string;
  formId: string;
  organization: string;
  formTitle: string;
  formDescription: string;
  sentiment: string;
  feedbackDescription: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
};

export function DataTableInsight({
  selectedOrganization,
  userData,
}: {
  selectedOrganization: string;
  userData: UserData;
}) {
  const [data, setData] = React.useState<Insight[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAlert, setIsAlert] = React.useState<boolean>(false);
  const [alertVariant, setAlertVariant] = React.useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = React.useState<string | null>(
    null
  );
  const [alertTitle, setAlertTitle] = React.useState<string | null>(null);

  // Add state for controlling modals
  const [feedbackDetailOpen, setFeedbackDetailOpen] = React.useState(false);
  const [formDetailOpen, setFormDetailOpen] = React.useState(false);
  const [insightDetailOpen, setInsightDetailOpen] = React.useState(false);
  const [selectedInsight, setSelectedInsight] = React.useState<Insight | null>(
    null
  );
  const [feedbackDetails, setFeedbackDetails] = React.useState<any>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = React.useState(false);

  // Add emoji mapping for sentiment values
  const sentimentEmojis: Record<string, string> = {
    "very dissatisfied": "😠",
    dissatisfied: "🙁",
    "somewhat dissatisfied": "😕",
    neutral: "😐",
    "somewhat satisfied": "🙂",
    satisfied: "😊",
    "very satisfied": "😄",
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/insight/${id}/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        setAlertTitle("Success");
        setAlertDescription("Successfully deleted insight");
        setAlertVariant("default");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
        setData((prevData) => prevData.filter((insight) => insight._id !== id));
      }
      if (response.status === 401) {
        setAlertTitle("Unauthorized");
        setAlertDescription("Invalid or expired token");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
      if (response.status === 403) {
        setAlertTitle("Forbidden");
        setAlertDescription("Not authorized or missing token");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
      if (response.status === 404) {
        setAlertTitle("Not Found");
        setAlertDescription("Insight not found");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
      if (response.status === 429) {
        setAlertTitle("Too Many Requests");
        setAlertDescription("Please wait a few minutes before trying again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
      if (response.status === 500) {
        setAlertTitle("Server Error");
        setAlertDescription("An error occurred. Please try again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to delete insight:", err);
      setAlertTitle("Error");
      setAlertDescription("Failed to delete insight. Please try again.");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    }
  };

  const fetchFeedbackDetails = async (feedbackId: string) => {
    try {
      setIsFetchingFeedback(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/feedback/${feedbackId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        const feedback = await response.json();
        setFeedbackDetails(feedback);
        setFeedbackDetailOpen(true);
      } else if (response.status === 404) {
        setAlertTitle("Not Found");
        setAlertDescription("Feedback not found");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 401) {
        setAlertTitle("Unauthorized");
        setAlertDescription("Invalid or expired token");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 403) {
        setAlertTitle("Forbidden");
        setAlertDescription("Not authorized or missing token");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 500) {
        setAlertTitle("Server Error");
        setAlertDescription("An error occurred. Please try again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to fetch feedback details:", err);
      setAlertTitle("Error");
      setAlertDescription("Failed to load feedback details. Please try again.");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  // Function to check if user is admin or subadmin in the current organization
  const isAdminOrSubAdmin = React.useMemo(() => {
    if (!userData || !userData.organizationDetails) return false;

    // Find the current organization in user's organization details
    const currentOrg = userData.organizationDetails.find(
      (org) => org.identifier === selectedOrganization
    );

    if (!currentOrg) return false;

    // Find the current user's membership in the organization
    const userMembership = currentOrg.members.find((member) =>
      typeof member.user === "object"
        ? member.user._id === userData._id
        : member.user === userData._id
    );

    // Check if user has admin or subadmin role
    return (
      userMembership &&
      (userMembership.role === "admin" || userMembership.role === "subadmin")
    );
  }, [userData, selectedOrganization]);

  const columns: ColumnDef<Insight>[] = [
    {
      accessorKey: "formTitle",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Form Title
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("formTitle")}</div>
      ),
    },
    {
      accessorKey: "feedbackDescription",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Feedback Description
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div
          className="max-w-xs truncate"
          title={row.getValue("feedbackDescription")}
        >
          {row.getValue("feedbackDescription")}
        </div>
      ),
    },
    {
      accessorKey: "keywords",
      header: "Keywords",
      cell: ({ row }) => {
        const keywords = row.getValue("keywords") as string[];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {keywords.slice(0, 5).map((keyword, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {keyword}
              </span>
            ))}
            {keywords.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{keywords.length - 5} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sentiment",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sentiment
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const sentiment = row.getValue("sentiment") as string;
        return (
          <div className="text-2xl flex items-center" title={sentiment}>
            {sentimentEmojis[sentiment.toLowerCase()] || sentiment}
            <span className="ml-2 text-xs text-muted-foreground">
              {sentiment}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const insight = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedInsight(insight);
                  setInsightDetailOpen(true);
                }}
              >
                View insight details
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedInsight(insight);
                  fetchFeedbackDetails(insight.feedbackId);
                }}
                disabled={isFetchingFeedback}
              >
                {isFetchingFeedback ? "Loading..." : "View feedback details"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedInsight(insight);
                  setFormDetailOpen(true);
                }}
              >
                View form details
              </DropdownMenuItem>

              {/* Only show delete option for admins and subadmins */}
              {isAdminOrSubAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      handleDeleteInsight(insight._id);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  React.useEffect(() => {
    const fetchInsightData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/insight/organization/${selectedOrganization}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (response.ok || response.status === 204) {
          const insightData = await response.json();
          setData(insightData);
        }

        if (response.status === 401) {
          setAlertTitle("Unauthorized");
          setAlertDescription("Invalid or expired token");
          setAlertVariant("destructive");
          setIsAlert(true);
          setTimeout(() => {
            setIsAlert(false);
          }, 3000);
        }
        if (response.status === 403) {
          setAlertTitle("Forbidden");
          setAlertDescription("Not authorized or missing token");
          setAlertVariant("destructive");
          setIsAlert(true);
          setTimeout(() => {
            setIsAlert(false);
          }, 3000);
        }
        if (response.status === 429) {
          setAlertTitle("Too Many Requests");
          setAlertDescription("Please wait a few minutes before trying again.");
          setAlertVariant("destructive");
          setIsAlert(true);
          setTimeout(() => {
            setIsAlert(false);
          }, 3000);
        }
        if (response.status === 500) {
          setAlertTitle("Server Error");
          setAlertDescription("An error occurred. Please try again.");
          setAlertVariant("destructive");
          setIsAlert(true);
          setTimeout(() => {
            setIsAlert(false);
          }, 3000);
        }
      } catch {
        setAlertTitle("Error");
        setAlertDescription("Failed to load insight data. Please try again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsightData();
  }, [selectedOrganization]);

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = String(row.getValue(columnId) || "").toLowerCase();
      return value.includes(String(filterValue).toLowerCase());
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

  if (isLoading) {
    return (
      <div className="w-full py-10 text-center">Loading insight data...</div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Search across all columns..."
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
        <div className="rounded-md border w-full overflow-hidden">
          <Table className=" w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="break-words">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
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
        </div>
      </div>

      {/* Add controlled dialogs outside of the table rendering */}
      <Dialog open={insightDetailOpen} onOpenChange={setInsightDetailOpen}>
        {selectedInsight && <InsightDetailModal details={selectedInsight} />}
      </Dialog>

      <Dialog open={feedbackDetailOpen} onOpenChange={setFeedbackDetailOpen}>
        {feedbackDetails && <FeedbackDetailModal details={feedbackDetails} />}
      </Dialog>

      <Dialog open={formDetailOpen} onOpenChange={setFormDetailOpen}>
        {selectedInsight && <FormDetailModal formId={selectedInsight.formId} />}
      </Dialog>

      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0">
          <Alert variant={alertVariant}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
