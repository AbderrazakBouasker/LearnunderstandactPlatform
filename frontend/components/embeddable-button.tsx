import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FeedbackForm } from "@/components/feedback-form";

export function EmbeddableButton({
  formid,
  isEmbedded,
}: {
  formid: string;
  isEmbedded: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-20 right-4 z-50 rotate-270 "
          variant="outline"
        >
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="fill max-w-2xl w-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="hidden">
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Fill the form to submit your feedback.
          </DialogDescription>
        </DialogHeader>
        <FeedbackForm formid={formid} isEmbedded={isEmbedded} />
      </DialogContent>
    </Dialog>
  );
}
