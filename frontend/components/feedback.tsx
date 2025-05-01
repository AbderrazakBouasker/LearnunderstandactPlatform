"use client";
import { DataTableFeedback } from "./data-table-feedback";
export function Feedback({
  selectedOrganization,
}: {
  selectedOrganization: string;
}) {
  return (
    <>
      <DataTableFeedback selectedOrganization={selectedOrganization} />
    </>
  );
}
