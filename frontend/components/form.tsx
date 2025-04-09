"use client";
import { DataTableForm } from "@/components/data-table-form";
import { CreateFormModal } from "./create-form-modal";
export function Form() {
  return (
    <>
      <CreateFormModal action="create" />
      <DataTableForm />
    </>
  );
}
