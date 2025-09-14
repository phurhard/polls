"use client"

import { useState, useEffect } from "react"
import { PollCard } from "@/components/polls/poll-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Poll, PollFilters } from "@/types"
import { useRouter } from "next/navigation"

// Mock data - replace with actual API calls
const mockPolls: Poll[] = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Help us understand the community's preferences for programming languages in 2024.",
    creatorId: "user1",
    creator: {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01")
    },
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
        _count: { votes: 45 }
      },
      {
        id: "opt2",
        pollId: "1",
        text: "Python",
        order: 1,
        votes: [],
        _count: { votes: 38 }
      },
      {
        id: "opt3",
        pollId: "1",
        text: "TypeScript",
        order: 2,
        votes: [],
        _count: { votes: 32 }
      },
      {
        id: "opt4",
        pollId: "1",
        text: "Go",
        order: 3,
        votes: [],
        _count: { votes: 15 }
      }
    ],
    _count: { votes: 130 }
  },
  {
    id: "2",
    title: "Best time for team meetings?",
    description: "When should we schedule our weekly team sync meetings?",
    creatorId: "user2",
    creator: {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01")
    },
    isActive: true,
    allowMultipleChoices: true,
    expiresAt: new Date("2024-02-15"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    options: [
      {
        id: "opt5",
        pollId: "2",
        text: "Monday 9 AM",
        order: 0,
        votes: [],
        _count: { votes: 8 }
      },
      {
        id: "opt6",
        pollId: "2",
        text: "Wednesday 2 PM",
        order: 1,
        votes: [],
        _count: { votes: 12 }
      },
      {
        id: "opt7",
        pollId: "2",
        text: "Friday 11 AM",
        order: 2,
        votes: [],
        _count: { votes: 5 }
      }
    ],
    _count: { votes: 25 }
  },
  {
    id: "3",
    title: "Office lunch preferences",
    description: "What type of food should we order for next week's team lunch?",
    creatorId: "user1",
    creator: {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01")
    },
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
        _count: { votes: 18 }
      },
      {
        id: "opt9",
        pollId: "3",
        text: "Chinese",
        order: 1,
        votes: [],
        _count: { votes: 22 }
      },
      {
        id: "opt10",
        pollId: "3",
        text: "Mexican",
        order: 2,
        votes: [],
        _count: { votes: 15 }
      },
      {
        id: "opt11",
        pollId: "3",
        text: "Sandwiches",
        order: 3,
        votes: [],
        _count: { votes: 9 }
      }
    ],
    _count: { votes: 64 }
  }
]

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<PollFilters>({
    status: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const router = useRouter()

  // Load polls (mock data for now)
  useEffect(() => {
    const loadPolls = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPolls(mockPolls)
      } catch (error) {
        console.error("Failed to load polls:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPolls()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...polls]

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(poll => {
        const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date()
        if (filters.status === 'active') {
          return poll.isActive && !isExpired
        } else if (filters.status === 'expired') {
          return !poll.isActive || isExpired
        }
        return true
      })
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(searchLower) ||
        poll.description?.toLowerCase().includes(searchLower) ||
        poll.creator?.name.toLowerCase().includes(searchLower)
      )
    }

    // Creator filter
    if (filters.creatorId) {
      filtered = filtered.filter(poll => poll.creatorId === filters.creatorId)
    }

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (filters.sortBy) {
          case 'title':
            aValue = a.title.toLowerCase()
            bValue = b.title.toLowerCase()
            break
          case 'votes':
            aValue = a._count?.votes || 0
            bValue = b._count?.votes || 0
            break
          case 'updatedAt':
            aValue = new Date(a.updatedAt).getTime()
            bValue = new Date(b.updatedAt).getTime()
            break
          case 'createdAt':
          default:
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
        }

        if (filters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    setFilteredPolls(filtered)
  }, [polls, filters])

  const handleFilterChange = (key: keyof PollFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleVote = (pollId: string) => {
    router.push(`/polls/${pollId}`)
  }

  const activePolls = polls.filter(poll => {
    const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date()
    return poll.isActive && !isExpired
  }).length

  const totalVotes = polls.reduce((sum, poll) => sum + (poll._count?.votes || 0), 0)

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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
            <p className="text-gray-600 mt-2">
              Discover and participate in community polls
            </p>
          </div>
          <Button onClick={() => router.push('/polls/create')} className="whitespace-nowrap">
            Create New Poll
          </Button>
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
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' }
                ].map(status => (
                  <Badge
                    key={status.value}
                    variant={filters.status === status.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleFilterChange('status', status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder)
                  }}
                  className="px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="votes-desc">Most Voted</option>
                  <option value="votes-asc">Least Voted</option>
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
              <div className="text-gray-500 mb-4">
                {filters.search || filters.status !== 'all' ? (
                  <>No polls found matching your filters</>
                ) : (
                  <>No polls available yet</>
                )}
              </div>
              {!filters.search && filters.status === 'all' && (
                <Button onClick={() => router.push('/polls/create')}>
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
        {filteredPolls.length >= 9 && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => {
              // Implement load more functionality
              console.log("Load more polls...")
            }}>
              Load More Polls
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
