"use client";

import React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ArrowUpDown, ChevronDown, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ClusterAnalysis } from "./data-table-recommendation";

// Define the Insight type based on your existing insight structure
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

interface RecommendationInsightDetailModalProps {
  cluster: ClusterAnalysis;
}

export function RecommendationInsightDetailModal({
  cluster,
}: RecommendationInsightDetailModalProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Use the insights directly from the cluster data
  const data = cluster.insightIds || [];

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
              <Badge key={index} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {keywords.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{keywords.length - 5} more
              </Badge>
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
  ];

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

  return (
    <DialogContent className="max-w-6xl min-w-min max-h-[95vh] overflow-y-auto p-6">
      <DialogHeader className="pb-4">
        <DialogTitle className="flex items-center gap-2 text-xl">
          <List className="h-6 w-6" />
          Insights in Cluster: {cluster.clusterLabel}
        </DialogTitle>
        <DialogDescription className="text-base">
          All insights contained in this cluster ({data.length} insights)
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center py-4 gap-4">
          <Input
            placeholder="Search insights..."
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
                    No insights found in this cluster.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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
    </DialogContent>
  );
}
