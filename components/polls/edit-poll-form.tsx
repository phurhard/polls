"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/database"
import type { UpdatePollData } from "@/types"

type EditPollFormProps = {
  pollId: string
  initialData: {
    title: string
    description?: string | null
    isActive: boolean
    expiresAt?: Date | null
    categoryId?: string | null
  }
}

export default function EditPollForm({ pollId, initialData }: EditPollFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<UpdatePollData>({
    title: initialData.title,
    description: initialData.description || "",
    isActive: initialData.isActive,
    expiresAt: initialData.expiresAt ?? undefined,
    categoryId: initialData.categoryId ?? undefined,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>("")

  type Category = { id: string; name: string; color?: string | null }
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("poll_categories")
          .select("id,name,color")
          .eq("is_active", true)
          .order("name")
        if (!cancelled && !error && Array.isArray(data)) {
          setCategories(data as any)
        }
      } finally {
        if (!cancelled) setIsLoadingCategories(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = "checked" in e.target ? (e.target as HTMLInputElement).checked : false
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.title || !formData.title.trim()) {
      return "Poll title is required"
    }
    if (formData.expiresAt) {
      const dt = new Date(formData.expiresAt)
      if (Number.isNaN(dt.getTime())) {
        return "Invalid expiration date"
      }
      // For edit, allow past to immediately expire; no future check enforced
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError("You must be signed in to update a poll")
        return
      }

      const payload: UpdatePollData = {
        title: formData.title?.trim(),
        description: (formData.description ?? "").trim(),
        isActive: !!formData.isActive,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
        categoryId: (formData as any).categoryId || null,
      }

      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json?.success) {
        setError(json?.error || "Failed to update poll")
        return
      }

      router.push(`/polls/${pollId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while updating the poll")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return
    }
    setIsDeleting(true)
    setError("")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError("You must be signed in to delete a poll")
        return
      }

      const res = await fetch(`/api/polls/${pollId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        setError(json?.error || "Failed to delete poll")
        return
      }

      router.push("/polls")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting the poll")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDateTimeLocal = (date?: Date | null) => {
    if (!date) return ""
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Edit Poll</CardTitle>
        <CardDescription>Update your poll details. Options editing is not supported in this screen.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter poll title"
              value={formData.title || ""}
              onChange={handleInputChange}
              disabled={isLoading}
              maxLength={200}
              required
            />
            <div className="text-xs text-muted-foreground">
              {(formData.title || "").length}/200 characters
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              name="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add context or details for your poll"
              value={formData.description ?? ""}
              onChange={handleInputChange}
              disabled={isLoading}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground">
              {(formData.description ?? "").length}/500 characters
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Poll Settings</Label>

            {/* Active */}
            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={!!formData.isActive}
                onChange={handleInputChange}
                disabled={isLoading}
                className="rounded border-input"
              />
              <Label htmlFor="isActive" className="text-sm">
                Poll is active
              </Label>
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry Date & Time (Optional)</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                value={formatDateTimeLocal(formData.expiresAt ?? undefined)}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    expiresAt: value ? new Date(value) : undefined
                  }))
                }}
                disabled={isLoading}
              />
              <div className="text-xs text-muted-foreground">Leave empty for no expiration.</div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category (Optional)</Label>
              <select
                id="categoryId"
                name="categoryId"
                value={(formData as any).categoryId || ""}
                onChange={(e) => {
                  const value = e.target.value || undefined
                  setFormData(prev => ({ ...prev, categoryId: value as any }))
                }}
                disabled={isLoading || isLoadingCategories}
                className="px-3 py-2 border border-input rounded-md text-sm w-full bg-background"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading || isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isDeleting}
              className="flex-1"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive hover:text-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
            >
              {isDeleting ? "Deleting..." : "Delete Poll"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
