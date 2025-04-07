// import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  // DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FeedbackDetailModal({
  details,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>;
}) {
  // Define which top-level fields to display
  const mainFieldsToDisplay = [
    "formTitle",
    "formDescription",
    "opinion",
    "createdAt",
  ];

  // Fields to skip from direct display
  const skipFields = ["fields", "_id", "__v", "formId", "updatedAt"];

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Feedback Details</DialogTitle>
        <DialogDescription>
          Submission details for form: {details.formTitle}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
        {/* Display main form information */}
        {mainFieldsToDisplay.map((key) =>
          details[key] ? (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={key} className="text-right capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <Input
                id={key}
                value={details[key]?.toString() || ""}
                className="col-span-3"
                disabled
              />
            </div>
          ) : null
        )}

        {/* Display custom field values */}
        <div className="border-t pt-4 mt-2">
          <h3 className="font-medium mb-3">User Responses</h3>
          {details.fields && details.fields.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details.fields.map((field: any) => (
              <div
                key={field._id}
                className="grid grid-cols-4 items-center gap-4 mb-2"
              >
                <Label htmlFor={field._id} className="text-right capitalize">
                  {field.label}
                </Label>
                <Input
                  id={field._id}
                  value={field.value || ""}
                  className="col-span-3"
                  disabled
                />
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              No field responses available
            </p>
          )}
        </div>

        {/* Display any other fields we didn't explicitly handle */}
        {Object.entries(details)
          .filter(
            ([key, value]) =>
              !skipFields.includes(key) &&
              !mainFieldsToDisplay.includes(key) &&
              typeof value !== "function" &&
              (typeof value !== "object" || value === null)
          )
          .map(([key, value]) => (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={key} className="text-right capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <Input
                id={key}
                value={value?.toString() || ""}
                className="col-span-3"
                disabled
              />
            </div>
          ))}
      </div>
      {/* <DialogFooter></DialogFooter> */}
    </DialogContent>
  );
}
