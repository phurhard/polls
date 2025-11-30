"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface VoteTimelineProps {
  timeline: Array<{ date: string; count: number }>;
}

export function VoteTimeline({ timeline }: VoteTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vote Timeline</CardTitle>
          <CardDescription>Voting activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No votes have been cast yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find max count for scaling
  const maxCount = Math.max(...timeline.map((t) => t.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Timeline</CardTitle>
        <CardDescription>
          Voting activity over time ({timeline.length} day{timeline.length !== 1 ? "s" : ""})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((entry, index) => {
            const heightPercentage = (entry.count / maxCount) * 100;

            return (
              <div key={index} className="flex items-center gap-4">
                {/* Date label */}
                <div className="w-24 text-sm text-muted-foreground text-right">
                  {entry.date}
                </div>

                {/* Bar chart */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300 flex items-center justify-end pr-3"
                      style={{ width: `${heightPercentage}%` }}
                    >
                      {heightPercentage > 15 && (
                        <span className="text-xs font-medium text-primary-foreground">
                          {entry.count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Count label (outside bar if bar is too small) */}
                  {heightPercentage <= 15 && (
                    <span className="text-sm font-medium text-foreground w-8">
                      {entry.count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Votes:</span>
              <p className="font-medium text-foreground">
                {timeline.reduce((sum, t) => sum + t.count, 0)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Peak Day:</span>
              <p className="font-medium text-foreground">
                {timeline.reduce((max, t) => (t.count > max.count ? t : max)).date}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

