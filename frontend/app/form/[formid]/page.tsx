import { FeedbackForm } from "@/components/feedback-form";
export default async function Form({
  params,
}: {
  params: Promise<{ formid: string }>;
}) {
  const { formid } = await params;
  return (
    <>
      <FeedbackForm formid={formid} />
    </>
  );
}
