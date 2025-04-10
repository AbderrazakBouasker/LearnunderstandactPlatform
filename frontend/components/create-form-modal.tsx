import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormsForm } from "./forms-form";

export function CreateFormModal({
  action,
  form,
}: {
  action: string;
  form?: {
    id: string;
    title: string;
    description: string;
    opinion: [];
    fields: [];
    createdAt: string;
    updatedAt: string;
  };
}) {
  return (
    <>
      {action === "create" ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Create a new Form</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-auto max-h-[90vh] overflow-y-auto">
            <FormsForm action="create" />
          </DialogContent>
        </Dialog>
      ) : action === "edit" && form ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Form</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-auto max-h-[90vh] overflow-y-auto">
            <FormsForm action="edit" form={form} />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
