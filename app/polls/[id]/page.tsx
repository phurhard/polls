import { notFound } from "next/navigation"
import Link from "next/link"
import { getPollUnified } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import VotePanel from "@/components/polls/vote-panel"

export const revalidate = 0

type PageProps = {
  params: { id: string }
}

export default async function PollDetailPage({ params }: PageProps) {
  const { id } = params

  const result = await getPollUnified(id)
  if (!result.success || !result.data) {
    notFound()
  }

  const poll = result.data
  const totalVotes = poll._count?.votes ?? 0

  const isExpired =
    poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{poll.title}</CardTitle>
            <CardDescription>
              {poll.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground">
              {isExpired
                ? "This poll has expired."
                : poll.expiresAt
                ? `Expires on ${new Date(poll.expiresAt).toLocaleString()}`
                : "No expiration date"}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Vote</h3>
              <VotePanel
                pollId={poll.id}
                allowMultipleChoices={poll.allowMultipleChoices}
                options={poll.options.map((o) => ({ id: o.id, text: o.text }))}
                isActive={poll.isActive}
                isExpired={isExpired}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Current results</h3>
              <ul className="space-y-2">
                {poll.options.map((opt) => {
                  const count = opt._count?.votes || 0;
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <li key={opt.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 pr-2 text-card-foreground">{opt.text}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {count} ({pct}%)
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                Total votes: {poll._count?.votes ?? 0}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/polls">Back to Polls</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
