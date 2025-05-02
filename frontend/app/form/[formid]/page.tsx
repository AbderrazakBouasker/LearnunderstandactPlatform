import { FeedbackForm } from "@/components/feedback-form";
import { EmbeddableFeedbackForm } from "@/components/embeddable-feedback-form";
export default async function Form({
  params,
  isEmbedded = false,
}: {
  params: Promise<{ formid: string }>;
  isEmbedded: boolean;
}) {
  const { formid } = await params;
  return (
    <>
      {isEmbedded ? (
        <EmbeddableFeedbackForm formid={formid} isEmbedded={isEmbedded} />
      ) : (
        <FeedbackForm formid={formid} />
      )}
    </>
  );
}
