import { FeedbackForm } from "@/components/feedback-form";

export default async function EmbeddedForm({
  params,
}: {
  params: Promise<{ formid: string }>;
}) {
  const { formid } = await params;

  return (
    <div className="h-full w-full bg-transparent">
      <FeedbackForm formid={formid} isEmbedded={true} />
    </div>
  );
}

// Add metadata to customize the embedded page
export const metadata = {
  title: "Feedback Form",
  description: "Embedded feedback form",
};
