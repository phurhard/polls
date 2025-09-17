"use client";

import { useState, useEffect } from "react";
import { PollCard } from "@/components/polls/poll-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Poll, User } from "@/types";

// Mock data - replace with actual API calls
const mockUser: User = {
  id: "user1",
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockUserPolls: Poll[] = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description:
      "Help us understand the community's preferences for programming languages in 2024.",
    creatorId: "user1",
    creator: mockUser,
    isActive: true,
    allowMultipleChoices: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    options: [
      {
        id: "opt1",
        pollId: "1",
        text: "JavaScript",
        order: 0,
        votes: [],
        _count: { votes: 45 },
      },
      {
        id: "opt2",
        pollId: "1",
        text: "Python",
        order: 1,
        votes: [],
        _count: { votes: 38 },
      },
      {
        id: "opt3",
        pollId: "1",
        text: "TypeScript",
        order: 2,
        votes: [],
        _count: { votes: 32 },
      },
      {
        id: "opt4",
        pollId: "1",
        text: "Go",
        order: 3,
        votes: [],
        _count: { votes: 15 },
      },
    ],
    _count: { votes: 130 },
  },
  {
    id: "3",
    title: "Office lunch preferences",
    description:
      "What type of food should we order for next week's team lunch?",
    creatorId: "user1",
    creator: mockUser,
    isActive: false,
    allowMultipleChoices: false,
    expiresAt: new Date("2024-01-20"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-20"),
    options: [
      {
        id: "opt8",
        pollId: "3",
        text: "Pizza",
        order: 0,
        votes: [],
        _count: { votes: 18 },
      },
      {
        id: "opt9",
        pollId: "3",
        text: "Chinese",
        order: 1,
        votes: [],
        _count: { votes: 22 },
      },
      {
        id: "opt10",
        pollId: "3",
        text: "Mexican",
        order: 2,
        votes: [],
        _count: { votes: 15 },
      },
      {
        id: "opt11",
        pollId: "3",
        text: "Sandwiches",
        order: 3,
        votes: [],
        _count: { votes: 9 },
      },
    ],
    _count: { votes: 64 },
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Simulate API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUser(mockUser);
        setUserPolls(mockUserPolls);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleEditPoll = (pollId: string) => {
    router.push(`/polls/${pollId}/edit`);
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      // Simulate API call
      console.log("Deleting poll:", pollId);
      setUserPolls((prev) => prev.filter((poll) => poll.id !== pollId));
    } catch (error) {
      console.error("Failed to delete poll:", error);
    }
  };

  const handleViewPoll = (pollId: string) => {
    router.push(`/polls/${pollId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Card>
            <CardContent className="p-12">
              <div className="text-destructive mb-4">
                Failed to load user data
              </div>
              <Button onClick={() => router.push("/auth/signin")}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activePolls = userPolls.filter((poll) => {
    const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
    return poll.isActive && !isExpired;
  }).length;

  const totalVotes = userPolls.reduce(
    (sum, poll) => sum + (poll._count?.votes || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user.name}!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={() => router.push("/polls")}>
              Browse All Polls
            </Button>
            <Button onClick={() => router.push("/polls/create")}>
              Create New Poll
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Polls Created
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-card-foreground">
                {userPolls.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {activePolls} active, {userPolls.length - activePolls} inactive
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Votes Received
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-card-foreground">
                {totalVotes}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Across all your polls
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
              <div className="text-xs text-muted-foreground mt-2">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push("/polls/create")}>
                Create New Poll
              </Button>
              <Button variant="outline" onClick={() => router.push("/polls")}>
                Browse Polls
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate to profile/settings when implemented
                  console.log("Navigate to settings");
                }}
              >
                Account Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User's Polls */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Your Polls
            </h2>
            {userPolls.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to user's polls page when implemented
                  console.log("View all user polls");
                }}
              >
                View All
              </Button>
            )}
          </div>

          {userPolls.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-6">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5l7 7 7-7M8 21l4-4 4 4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-card-foreground mb-2">
                  No polls yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first poll to start gathering opinions and
                  feedback.
                </p>
                <Button onClick={() => router.push("/polls/create")}>
                  Create Your First Poll
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userPolls.slice(0, 4).map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={handleViewPoll}
                  onEdit={handleEditPoll}
                  onDelete={handleDeletePoll}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity - Placeholder for future implementation */}
        {userPolls.length > 0 && (
          <Card className="mt-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest votes and interactions on your polls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Recent activity will be displayed here once implemented
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
