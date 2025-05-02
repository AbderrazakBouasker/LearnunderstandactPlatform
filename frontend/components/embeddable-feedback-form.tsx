import { EmbeddableButton } from "@/components/embeddable-button";
export function EmbeddableFeedbackForm({
  isEmbedded,
  formid,
}: {
  formid: string;
  isEmbedded: boolean;
}) {
  return (
    <>
      <EmbeddableButton formid={formid} isEmbedded={isEmbedded} />
    </>
  );
}
