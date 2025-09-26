import { CreatePollForm } from "@/components/polls/create-poll-form"

export default function CreatePollPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <CreatePollForm />
      </div>
    </div>
  )
}
