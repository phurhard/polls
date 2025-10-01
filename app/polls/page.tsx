"use client";

import { useState, useEffect } from "react";
import { PollCard } from "@/components/polls/poll-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Poll, PollFilters } from "@/types";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/database";

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PollFilters>({
    status: "all",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const PAGE_LIMIT = 9;
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const router = useRouter();

  type Category = { id: string; name: string; color?: string | null };
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories for filter
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('poll_categories')
          .select('id,name,color')
          .eq('is_active', true)
          .order('name');
        if (!cancelled && !error && Array.isArray(data)) {
          setCategories(data as any);
        }
      } finally {
        if (!cancelled) setIsLoadingCategories(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load polls via API with server-side filters/sort/pagination
  useEffect(() => {
    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("status", (filters.status || "all") as string);
        if (filters.search) params.set("search", filters.search);
        if (filters.categoryId) params.set("category_id", filters.categoryId);
        const sortBy =
          filters.sortBy === "totalVotes" ? "total_votes" :
          filters.sortBy === "createdAt" ? "created_at" :
          filters.sortBy === "updatedAt" ? "updated_at" :
          (filters.sortBy || "created_at");
        params.set("sort_by", sortBy);
        params.set("sort_order", filters.sortOrder || "desc");
        params.set("limit", String(PAGE_LIMIT));
        params.set("offset", "0");

        const res = await fetch(`/api/polls?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data)) {
          setPolls(json.data as Poll[]);
          setOffset(0);
          setHasNext(!!json.pagination?.hasNext);
        } else {
          console.error("Failed to fetch polls:", json?.error);
          setPolls([]);
          setHasNext(false);
        }
      } catch (error) {
        console.error("Failed to load polls:", error);
        setPolls([]);
        setHasNext(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [filters.status, filters.search, filters.sortBy, filters.sortOrder]);

  // Client-side filtering now simplified (handled by server)
  useEffect(() => {
    setFilteredPolls(polls);
  }, [polls]);

  const handleFilterChange = (key: keyof PollFilters, value: string | number | boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleVote = (pollId: string) => {
    router.push(`/polls/${pollId}`);
  };

  const activePolls = polls.filter((poll) => {
    const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
    return poll.isActive && !isExpired;
  }).length;

  const totalVotes = polls.reduce(
    (sum, poll) => sum + (poll._count?.votes || 0),
    0,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Polls</h1>
            <p className="text-muted-foreground mt-2">
              Discover and participate in community polls
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/dashboard")}
              className="whitespace-nowrap"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push("/polls/create")}
              className="whitespace-nowrap"
            >
              Create New Poll
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{polls.length}</div>
              <div className="text-sm text-muted-foreground">Total Polls</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{activePolls}</div>
              <div className="text-sm text-muted-foreground">Active Polls</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{totalVotes}</div>
              <div className="text-sm text-muted-foreground">Total Votes</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search polls..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "expired", label: "Expired" },
                ].map((status) => (
                  <Badge
                    key={status.value}
                    variant={
                      filters.status === status.value ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleFilterChange("status", status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                <select
                  value={filters.categoryId || ""}
                  onChange={(e) => handleFilterChange("categoryId", e.target.value || null)}
                  className="px-3 py-2 border border-input rounded-md text-sm"
                  disabled={isLoadingCategories}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("-");
                    handleFilterChange("sortBy", sortBy);
                    handleFilterChange("sortOrder", sortOrder);
                  }}
                  className="px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="totalVotes-desc">Most Voted</option>
                  <option value="totalVotes-asc">Least Voted</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Polls Grid */}
        {filteredPolls.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground mb-4">
                {filters.search || filters.status !== "all" ? (
                  <>No polls found matching your filters</>
                ) : (
                  <>No polls available yet</>
                )}
              </div>
              {!filters.search && filters.status === "all" && (
                <Button onClick={() => router.push("/polls/create")}>
                  Create the First Poll
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={handleVote}
                showActions={true}
              />
            ))}
          </div>
        )}

        {/* Load More (for pagination) */}
        {hasNext && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              disabled={isFetchingMore}
              onClick={async () => {
                setIsFetchingMore(true);
                try {
                  const params = new URLSearchParams();
                  params.set("status", (filters.status || "all") as string);
                  if (filters.search) params.set("search", filters.search);
                  const sortBy =
                    filters.sortBy === "totalVotes" ? "total_votes" :
                    filters.sortBy === "createdAt" ? "created_at" :
                    filters.sortBy === "updatedAt" ? "updated_at" :
                    (filters.sortBy || "created_at");
                  if (filters.categoryId) params.set("category_id", filters.categoryId);
                  params.set("sort_by", sortBy);
                  params.set("sort_order", filters.sortOrder || "desc");
                  params.set("limit", String(PAGE_LIMIT));
                  params.set("offset", String(offset + PAGE_LIMIT));

                  const res = await fetch(`/api/polls?${params.toString()}`, { cache: "no-store" });
                  const json = await res.json();
                  if (res.ok && json?.success && Array.isArray(json.data)) {
                    setPolls(prev => [...prev, ...(json.data as Poll[])]);
                    setOffset(prev => prev + PAGE_LIMIT);
                    setHasNext(!!json.pagination?.hasNext);
                  } else {
                    setHasNext(false);
                  }
                } catch {
                  setHasNext(false);
                } finally {
                  setIsFetchingMore(false);
                }
              }}
            >
              {isFetchingMore ? "Loading..." : "Load More Polls"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
