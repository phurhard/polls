"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Poll, PollWithStats } from "@/types";

interface PollCardProps {
  poll: Poll | PollWithStats;
  showActions?: boolean;
  onVote?: (pollId: string) => void;
  onEdit?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
}

export function PollCard({
  poll,
  showActions = true,
  onVote,
  onEdit,
  onDelete,
}: PollCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  const totalVotes =
    "totalVotes" in poll ? poll.totalVotes : poll._count?.votes || 0;
  const hasUserVoted = "hasUserVoted" in poll ? poll.hasUserVoted : false;

  const handleVoteClick = async () => {
    if (onVote) {
      setIsLoading(true);
      try {
        await onVote(poll.id);
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push(`/polls/${poll.id}`);
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(poll.id);
    } else {
      router.push(`/polls/${poll.id}/edit`);
    }
  };

  const handleDeleteClick = () => {
    if (
      onDelete &&
      window.confirm("Are you sure you want to delete this poll?")
    ) {
      onDelete(poll.id);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow bg-card border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 text-card-foreground">
              {poll.title}
            </CardTitle>
            {poll.description && (
              <CardDescription className="mt-2 line-clamp-3 text-muted-foreground">
                {poll.description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <Badge
              variant={poll.isActive && !isExpired ? "default" : "secondary"}
            >
              {!poll.isActive ? "Inactive" : isExpired ? "Expired" : "Active"}
            </Badge>
            {poll.allowMultipleChoices && (
              <Badge variant="outline" className="text-xs">
                Multiple Choice
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Poll Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              {poll.options.length} option
              {poll.options.length !== 1 ? "s" : ""}
            </span>
            <span>
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
            </span>
            {hasUserVoted && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ Voted
              </span>
            )}
          </div>

          {/* Poll Options Preview */}
          <div className="space-y-2">
            {poll.options.slice(0, 3).map((option) => {
              const voteCount = option._count?.votes || 0;
              const percentage =
                totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

              return (
                <div
                  key={option.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate flex-1 pr-2 text-card-foreground">
                    {option.text}
                  </span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {voteCount} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
            {poll.options.length > 3 && (
              <div className="text-sm text-muted-foreground">
                +{poll.options.length - 3} more option
                {poll.options.length - 3 !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <span>Created: {formatDate(poll.createdAt)}</span>
            {poll.expiresAt && (
              <span>Expires: {formatDate(poll.expiresAt)}</span>
            )}
            {poll.creator && <span>By: {poll.creator.name}</span>}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleVoteClick}
                disabled={isLoading || !poll.isActive || isExpired}
                className="flex-1"
                variant={hasUserVoted ? "outline" : "default"}
              >
                {isLoading
                  ? "Loading..."
                  : hasUserVoted
                    ? "View Results"
                    : "Vote"}
              </Button>

              {(onEdit || onDelete) && (
                <>
                  {onEdit && (
                    <Button
                      onClick={handleEditClick}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      onClick={handleDeleteClick}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive/90"
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
