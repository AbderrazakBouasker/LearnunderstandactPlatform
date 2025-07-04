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
  Terminal,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FormSelectCombobox } from "@/components/form-select-combobox";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { RecommendationDetailModal } from "@/components/recommendation-detail-modal";
import {
  RecommendationInsightDetailModal,
  Insight,
} from "@/components/recommendation-insight-detail-modal";

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
  organizationDetails: OrganizationDetail[];
  id: string;
}

export type ClusterAnalysis = {
  _id: string;
  formId: string;
  organization: string;
  clusterLabel: string;
  clusterSummary: string;
  insightIds: Insight[];
  sentimentPercentage: number;
  clusterSize: number;
  recommendation: string;
  impact: "high" | "medium" | "low";
  urgency: "immediate" | "soon" | "later";
  ticketCreated: boolean;
  lastTicketDate?: string;
  jiraTicketId?: string;
  jiraTicketUrl?: string;
  jiraTicketStatus?: string;
  createdAt: string;
  updatedAt: string;
  formTitle?: string; // This will be populated from the backend or derived
};

interface Form {
  _id: string;
  title: string;
  description: string;
}

export function DataTableRecommendation({
  selectedOrganization,
}: {
  selectedOrganization: string;
  userData: UserData;
}) {
  const [data, setData] = React.useState<ClusterAnalysis[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAlert, setIsAlert] = React.useState<boolean>(false);
  const [alertVariant, setAlertVariant] = React.useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = React.useState<string | null>(
    null
  );
  const [alertTitle, setAlertTitle] = React.useState<string | null>(null);
  const [forms, setForms] = React.useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = React.useState<string | null>(null);

  // Modal state
  const [recommendationDetailOpen, setRecommendationDetailOpen] =
    React.useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    React.useState<ClusterAnalysis | null>(null);
  const [recommendationInsightOpen, setRecommendationInsightOpen] =
    React.useState(false);
  const [
    selectedRecommendationForInsights,
    setSelectedRecommendationForInsights,
  ] = React.useState<ClusterAnalysis | null>(null);

  const columns: ColumnDef<ClusterAnalysis>[] = [
    // Only show form title column when viewing organization-wide clusters
    ...(selectedForm
      ? []
      : [
          {
            accessorKey: "formTitle" as keyof ClusterAnalysis,
            header: ({ column }) => {
              return (
                <Button
                  variant="ghost"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  Form
                  <ArrowUpDown />
                </Button>
              );
            },
            cell: ({ row }) => {
              // Use formTitle if available, otherwise show form ID
              return (
                <div className="font-medium">
                  {row.original.formTitle || `Form ${row.original.formId}`}
                </div>
              );
            },
          } as ColumnDef<ClusterAnalysis>,
        ]),
    {
      accessorKey: "clusterLabel",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cluster Label
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("clusterLabel")}</div>
      ),
    },
    {
      accessorKey: "clusterSummary",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cluster Summary
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div
          className="max-w-md truncate"
          title={row.getValue("clusterSummary")}
        >
          {row.getValue("clusterSummary")}
        </div>
      ),
    },
    {
      accessorKey: "sentimentPercentage",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sentiment %
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const percentage = row.getValue("sentimentPercentage") as number;
        return (
          <div className="text-center">
            <Badge
              variant={
                percentage < 30
                  ? "default"
                  : percentage < 70
                  ? "secondary"
                  : "destructive"
              }
            >
              {percentage.toFixed(2)}%
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "recommendation",
      header: "Recommendation",
      cell: ({ row }) => (
        <div
          className="max-w-md truncate"
          title={row.getValue("recommendation")}
        >
          {row.getValue("recommendation") || "No recommendation"}
        </div>
      ),
    },
    {
      accessorKey: "clusterSize",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Size
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("clusterSize")}</div>
      ),
    },
    {
      accessorKey: "impact",
      header: "Impact",
      cell: ({ row }) => {
        const impact = row.getValue("impact") as string;
        return (
          <Badge
            variant={
              impact === "high"
                ? "destructive"
                : impact === "medium"
                ? "secondary"
                : "outline"
            }
          >
            {impact}
          </Badge>
        );
      },
    },
    {
      accessorKey: "urgency",
      header: "Urgency",
      cell: ({ row }) => {
        const urgency = row.getValue("urgency") as string;
        return (
          <Badge
            variant={
              urgency === "immediate"
                ? "destructive"
                : urgency === "soon"
                ? "secondary"
                : "outline"
            }
          >
            {urgency}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const cluster = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedRecommendation(cluster);
                  setRecommendationDetailOpen(true);
                }}
              >
                View recommendation details
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedRecommendationForInsights(cluster);
                  setRecommendationInsightOpen(true);
                }}
              >
                View insights in cluster
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Fetch forms for the organization
  const fetchForms = React.useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/organization/${selectedOrganization}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        const formsData = await response.json();
        setForms(formsData);
      }
    } catch (error) {
      console.error("Failed to fetch forms:", error);
      setForms([]);
    }
  }, [selectedOrganization]);

  // Function to enrich cluster data with form titles
  const enrichClustersWithFormTitles = React.useCallback(
    (clusters: ClusterAnalysis[], formsList: Form[]) => {
      return clusters.map((cluster) => {
        const form = formsList.find((f) => f._id === cluster.formId);
        return {
          ...cluster,
          formTitle: form?.title || `Form ${cluster.formId}`,
        };
      });
    },
    []
  );

  const fetchClusterData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      let response;

      if (selectedForm) {
        // Fetch clusters for specific form
        response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/cluster/form/${selectedForm}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
      } else {
        // Fetch clusters for entire organization
        response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/cluster/organization/${selectedOrganization}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
      }

      if (response.ok) {
        const clusterData = await response.json();
        let clustersToSet;

        // Handle different response structures
        if (selectedForm) {
          // Response from form endpoint: { formId, totalAnalyses, clusters }
          clustersToSet = clusterData.clusters || clusterData;
        } else {
          // Response from organization endpoint: { organization, summary, analysesByForm, allAnalyses }
          clustersToSet = clusterData.allAnalyses || clusterData;
          // Enrich with form titles for organization-wide view
          clustersToSet = enrichClustersWithFormTitles(clustersToSet, forms);
        }

        setData(clustersToSet);
      } else if (response.status === 404) {
        setData([]);
        setAlertTitle("No Clusters Found");
        setAlertDescription(
          selectedForm
            ? "No cluster analysis found for this form. You may need to generate clusters first."
            : "No cluster analysis found for this organization. You may need to generate clusters first."
        );
        setAlertVariant("default");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 5000);
      } else if (response.status === 401) {
        setAlertTitle("Unauthorized");
        setAlertDescription("You are not authorized to view this data.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 403) {
        setAlertTitle("Forbidden");
        setAlertDescription("You don't have permission to access this data.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else if (response.status === 500) {
        setAlertTitle("Server Error");
        setAlertDescription("An error occurred while fetching cluster data.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } else {
        setAlertTitle("Error");
        setAlertDescription("Failed to fetch cluster data. Please try again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to fetch cluster data:", error);
      setData([]);
      setAlertTitle("Error");
      setAlertDescription("Failed to fetch cluster data. Please try again.");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  }, [selectedForm, selectedOrganization, enrichClustersWithFormTitles, forms]);

  React.useEffect(() => {
    if (selectedOrganization) {
      fetchForms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganization]);

  React.useEffect(() => {
    if (selectedOrganization) {
      fetchClusterData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganization, forms]);

  React.useEffect(() => {
    // When form selection changes, fetch cluster data
    if (selectedOrganization) {
      fetchClusterData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedForm, selectedOrganization, forms]);

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      formTitle: false,
      clusterSize: false,
      impact: false,
      urgency: false,
    });
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
      <div className="w-full py-10 text-center">
        Loading {selectedForm ? "form-specific" : "organization-wide"} cluster
        analysis...
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="flex items-center py-4 gap-4">
          <Input
            placeholder="Search clusters..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <FormSelectCombobox
            items={[
              { value: "", label: "All Forms" },
              ...forms.map((form: Form) => ({
                value: form._id,
                label: form.title,
              })),
            ]}
            selectedValue={selectedForm || ""}
            onValueChange={(value) =>
              setSelectedForm(value === "" ? null : value)
            }
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
          <Table className="w-full">
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
                    className="h-24 text-center text-muted-foreground"
                  >
                    {selectedForm
                      ? "No cluster analysis found for this form."
                      : "No cluster analysis found for this organization."}
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

      {/* Recommendation Detail Modal */}
      <Dialog
        open={recommendationDetailOpen}
        onOpenChange={setRecommendationDetailOpen}
      >
        {selectedRecommendation && (
          <RecommendationDetailModal details={selectedRecommendation} />
        )}
      </Dialog>

      {/* Recommendation Insight Detail Modal */}
      <Dialog
        open={recommendationInsightOpen}
        onOpenChange={setRecommendationInsightOpen}
      >
        {selectedRecommendationForInsights && (
          <RecommendationInsightDetailModal
            cluster={selectedRecommendationForInsights}
          />
        )}
      </Dialog>

      {isAlert && (
        <div className="fixed bottom-10 left-250 right-0 flex items-center justify-center p-0">
          <Alert variant={alertVariant || "default"}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
