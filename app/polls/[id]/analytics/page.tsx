import { notFound } from "next/navigation";
import Link from "next/link";
import { getPollUnified, getPollVoteTimeline } from "@/lib/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoteTimeline } from "@/components/polls/vote-timeline";

// Disable caching for this page to always show fresh data
export const revalidate = 0;

type PageProps = {
  params: { id: string };
};

export default async function PollAnalyticsPage({ params }: PageProps) {
  const { id } = params;

  // Fetch poll data using existing database function
  const result = await getPollUnified(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const poll = result.data;
  const totalVotes = poll._count?.votes ?? 0;
  const uniqueVoters = poll.options.reduce((voters, option) => {
    // This is a simplified count - we'll improve this with a proper query later
    return voters + (option._count?.votes || 0);
  }, 0);

  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false;

  // Fetch vote timeline
  const timelineResult = await getPollVoteTimeline(id);
  const timeline = timelineResult.data || [];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Poll Analytics</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/polls/${poll.id}`}>View Poll</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/polls">Back to Polls</Link>
            </Button>
          </div>
        </div>

        {/* Poll Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{poll.title}</CardTitle>
                <CardDescription className="mt-2">
                  {poll.description || "No description provided."}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                <Badge variant={poll.isActive && !isExpired ? "default" : "secondary"}>
                  {!poll.isActive ? "Inactive" : isExpired ? "Expired" : "Active"}
                </Badge>
                {poll.allowMultipleChoices && (
                  <Badge variant="outline">Multiple Choice</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created by:</span>
                <p className="font-medium text-foreground">
                  {poll.creator?.name || "Unknown"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Created on:</span>
                <p className="font-medium text-foreground">
                  {new Date(poll.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {isExpired ? "Expired on:" : poll.expiresAt ? "Expires on:" : "Expiration:"}
                </span>
                <p className="font-medium text-foreground">
                  {poll.expiresAt
                    ? new Date(poll.expiresAt).toLocaleDateString()
                    : "No expiration"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Votes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-card-foreground">{totalVotes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {poll.options.length} option{poll.options.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participation Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-card-foreground">
                {totalVotes > 0 ? "Active" : "No votes yet"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalVotes} total vote{totalVotes !== 1 ? "s" : ""} cast
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Most Popular Option
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold text-card-foreground line-clamp-2">
                {poll.options.length > 0
                  ? poll.options.reduce((max, opt) =>
                      (opt._count?.votes || 0) > (max._count?.votes || 0) ? opt : max
                    ).text
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {poll.options.length > 0
                  ? `${poll.options.reduce((max, opt) =>
                      (opt._count?.votes || 0) > (max._count?.votes || 0) ? opt : max
                    )._count?.votes || 0} votes`
                  : "No options"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
            <CardDescription>Vote distribution across all options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {poll.options.map((option) => {
                const voteCount = option._count?.votes || 0;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{option.text}</span>
                      <span className="text-sm text-muted-foreground">
                        {voteCount} vote{voteCount !== 1 ? "s" : ""} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vote Timeline */}
        <VoteTimeline timeline={timeline} />
      </div>
    </div>
  );
}


