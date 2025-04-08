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
// import { Checkbox } from "@/components/ui/checkbox";
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
// import { FormDetailModal } from "@/components/form-detail-modal";
// import { FormFeedbackModal } from "@/components/form-feedback-modal";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
export type Form = {
  _id: string;
  title: string;
  description: string;
  opinion: [];
  fields: [];
  createdAt: string;
  updatedAt: string;
};

export function DataTableForm() {
  const [data, setData] = React.useState<Form[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAlert, setIsAlert] = React.useState<boolean>(false);
  const [alertVariant, setAlertVariant] = React.useState<
    "default" | "destructive" | null
  >("default");
  const [alertDescription, setAlertDescription] = React.useState<string | null>(
    null
  );
  const [alertTitle, setAlertTitle] = React.useState<string | null>(null);
  //   const [showFeedBackDetails, setShowFeedBackDetails] = React.useState(false);
  //   const [formDetails, setFormDetails] = React.useState<Form | null>(
  //     null
  //   );
  //   const [showFormDetails, setShowFormDetails] = React.useState(false);
  //   const [formDetails, setFormDetails] = React.useState(null);
  const handleDeleteForm = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/${id}/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        setAlertTitle("Success");
        setAlertDescription("Successfully deleted form");
        setAlertVariant("default");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
        setData((prevData) => prevData.filter((form) => form._id !== id));
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
        setAlertDescription("Form not found");
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
      console.error("Failed to delete form:", err);
      setAlertTitle("Error");
      setAlertDescription("Failed to delete form. Please try again.");
      setAlertVariant("destructive");
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 3000);
    }
  };

  const columns: ColumnDef<Form>[] = [
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("description")}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created At
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("createdAt")}</div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated At
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("updatedAt")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const form = row.original;

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
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    View form details
                  </DropdownMenuItem>
                </DialogTrigger>
                {/* <FormDetailModal details={form} /> */}
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    View form details
                  </DropdownMenuItem>
                </DialogTrigger>
                {/* <FormFeedbackModal formId={form._id} /> */}
              </Dialog>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  handleDeleteForm(form._id);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  React.useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (response.ok || response.status === 204) {
          const formData = await response.json();
          setData(formData);
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
        setAlertDescription("Failed to load form data. Please try again.");
        setAlertVariant("destructive");
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormData();
  }, []);

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
    return <div className="w-full py-10 text-center">Loading form data...</div>;
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
