"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreatePollData } from "@/types"
import { supabase } from "@/lib/database"

interface CreatePollFormProps {
  onSubmit?: (pollData: CreatePollData) => Promise<void>
  initialData?: Partial<CreatePollData>
}

export function CreatePollForm({ onSubmit, initialData }: CreatePollFormProps) {
  const [formData, setFormData] = useState<CreatePollData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    options: initialData?.options || ["", ""],
    allowMultipleChoices: initialData?.allowMultipleChoices || false,
    expiresAt: initialData?.expiresAt || undefined,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }))
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }))
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }))
    }
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return "Poll title is required"
    }

    const nonEmptyOptions = formData.options.filter(option => option.trim())
    if (nonEmptyOptions.length < 2) {
      return "At least 2 options are required"
    }

    const uniqueOptions = new Set(nonEmptyOptions.map(option => option.trim().toLowerCase()))
    if (uniqueOptions.size !== nonEmptyOptions.length) {
      return "All options must be unique"
    }

    if (formData.expiresAt) {
      const expiryDate = new Date(formData.expiresAt)
      if (expiryDate <= new Date()) {
        return "Expiry date must be in the future"
      }
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
      const cleanedData: CreatePollData = {
        ...formData,
        options: formData.options.filter(option => option.trim()),
        expiresAt: formData.expiresAt || undefined
      }

      if (onSubmit) {
        await onSubmit(cleanedData)
      } else {
        // Get current session token
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          setError("You must be signed in to create a poll")
          return
        }

        // Call API to create poll
        const res = await fetch("/api/polls/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: cleanedData.title,
            description: cleanedData.description || undefined,
            options: cleanedData.options,
            allowMultipleChoices: !!cleanedData.allowMultipleChoices,
            expiresAt: cleanedData.expiresAt ? new Date(cleanedData.expiresAt).toISOString() : undefined,
            categoryId: (cleanedData as any).categoryId || undefined,
          }),
        })

        const json = await res.json()
        if (!res.ok || !json?.success) {
          setError(json?.error || "Failed to create poll")
          return
        }

        const created = json.data
        if (created?.id) {
          router.push(`/polls/${created.id}`)
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while creating the poll")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTimeLocal = (date?: Date) => {
    if (!date) return ""
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Poll</CardTitle>
        <CardDescription>
          Create a poll to gather opinions and feedback from your audience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="What would you like to ask?"
              value={formData.title}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </div>
          </div>

          {/* Poll Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              name="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add more context to help people understand your poll..."
              value={formData.description ?? ""}
              onChange={handleInputChange}
              disabled={isLoading}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground">
              {(formData.description ?? "").length}/500 characters
            </div>
          </div>

          {/* Poll Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Poll Options *</Label>
              <Badge variant="outline">
                {formData.options.filter(opt => opt.trim()).length} options
              </Badge>
            </div>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      disabled={isLoading}
                      maxLength={100}
                    />
                  </div>
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {formData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                disabled={isLoading}
                className="w-full"
              >
                Add Another Option
              </Button>
            )}
            <div className="text-xs text-muted-foreground">
              Add 2-10 options for people to choose from
            </div>
          </div>

          {/* Poll Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Poll Settings</Label>

            {/* Multiple Choices */}
            <div className="flex items-center space-x-2">
              <input
                id="allowMultipleChoices"
                name="allowMultipleChoices"
                type="checkbox"
                checked={formData.allowMultipleChoices}
                onChange={handleInputChange}
                disabled={isLoading}
                className="rounded border-input"
              />
              <Label htmlFor="allowMultipleChoices" className="text-sm">
                Allow multiple choices
              </Label>
            </div>

            {/* Expiry Date */}
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
                min={new Date().toISOString().slice(0, 16)}
              />
              <div className="text-xs text-muted-foreground">
                Leave empty for polls that never expire
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <span className="text-sm text-destructive">
                {error}
              </span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating Poll..." : "Create Poll"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
