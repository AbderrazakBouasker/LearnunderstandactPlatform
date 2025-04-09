import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function FormsForm({
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
      <DialogHeader>
        <DialogTitle>
          {action === "create"
            ? "Create a new Form"
            : action === "edit"
            ? "Edit the Form"
            : null}
        </DialogTitle>
        <DialogDescription>
          {action === "create"
            ? "Create a new Form here. Click save when you're done."
            : action === "edit"
            ? "Edit the Form here. Click save when you're done."
            : null}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input id="name" value="Pedro Duarte" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="username" className="text-right">
            Username
          </Label>
          <Input id="username" value="@peduarte" className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </>
  );
}
