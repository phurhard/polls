import { notFound } from "next/navigation";
import EditPollForm from "@/components/polls/edit-poll-form";
import { getPollUnified } from "@/lib/database";

export const revalidate = 0;

type PageProps = {
  params: { id: string };
};

export default async function EditPollPage({ params }: PageProps) {
  const { id } = params;

  const result = await getPollUnified(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const poll = result.data;

  const initialData = {
    title: poll.title,
    description: poll.description ?? "",
    isActive: poll.isActive,
    expiresAt: poll.expiresAt ?? null,
    categoryId: poll.categoryId ?? null,
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <EditPollForm pollId={poll.id} initialData={initialData} />
      </div>
    </div>
  );
}
