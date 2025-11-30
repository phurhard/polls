"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface UserAnalyticsProps {
  votingStats: {
    totalVotesCast: number;
    pollsVotedOn: number;
    recentVotes: Array<{
      pollId: string;
      pollTitle: string;
      votedAt: string;
    }>;
  };
  pollsStats: {
    totalPollsCreated: number;
    activePolls: number;
    totalVotesReceived: number;
    mostPopularPoll: {
      id: string;
      title: string;
      voteCount: number;
    } | null;
  };
}

export function UserAnalytics({ votingStats, pollsStats }: UserAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Voting Activity Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Your Voting Activity</CardTitle>
          <CardDescription>Your participation in polls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Votes Cast</p>
              <p className="text-2xl font-bold text-card-foreground">
                {votingStats.totalVotesCast}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Polls Voted On</p>
              <p className="text-2xl font-bold text-card-foreground">
                {votingStats.pollsVotedOn}
              </p>
            </div>
          </div>

          {/* Recent Votes */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Recent Votes</h4>
            {votingStats.recentVotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No votes cast yet</p>
            ) : (
              <div className="space-y-2">
                {votingStats.recentVotes.slice(0, 5).map((vote, index) => (
                  <Link
                    key={index}
                    href={`/polls/${vote.pollId}/analytics`}
                    className="block p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground line-clamp-1 flex-1">
                        {vote.pollTitle}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(vote.votedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Polls Created Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Your Polls Performance</CardTitle>
          <CardDescription>Statistics about polls you created</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Polls Created</p>
              <p className="text-2xl font-bold text-card-foreground">
                {pollsStats.totalPollsCreated}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Polls</p>
              <p className="text-2xl font-bold text-card-foreground">
                {pollsStats.activePolls}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Votes Received</p>
              <p className="text-2xl font-bold text-card-foreground">
                {pollsStats.totalVotesReceived}
              </p>
            </div>
          </div>

          {/* Most Popular Poll */}
          {pollsStats.mostPopularPoll && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-3">
                Most Popular Poll
              </h4>
              <Link
                href={`/polls/${pollsStats.mostPopularPoll.id}/analytics`}
                className="block p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {pollsStats.mostPopularPoll.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pollsStats.mostPopularPoll.voteCount} vote
                      {pollsStats.mostPopularPoll.voteCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant="default">Top</Badge>
                </div>
              </Link>
            </div>
          )}

          {pollsStats.totalPollsCreated === 0 && (
            <div className="pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                You haven't created any polls yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

