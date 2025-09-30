"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type VotePanelProps = {
  pollId: string;
  allowMultipleChoices: boolean;
  options: { id: string; text: string }[];
  isActive: boolean;
  isExpired: boolean;
};

export function VotePanel({ pollId, allowMultipleChoices, options, isActive, isExpired }: VotePanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const disabled = isExpired || !isActive;

  // Prefill selection with user's existing votes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data, error: votesErr } = await supabase.rpc('get_user_votes', { poll_uuid: pollId } as any);
        if (!votesErr && Array.isArray(data)) {
          const optionIds = (data as any[]).map((v: any) => v.option_id);
          if (!cancelled) setSelected(optionIds);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [pollId]);

  const toggleSelection = (optionId: string) => {
    if (allowMultipleChoices) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const submitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setError(null);
    setSuccessMsg(null);

    if (selected.length === 0) {
      setError("Select at least one option to vote.");
      return;
    }
    if (!allowMultipleChoices && selected.length > 1) {
      setError("Only one option is allowed for this poll.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("You must be signed in to vote.");
        return;
      }

      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pollId,
          optionIds: selected,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error || "Failed to cast vote.");
        return;
      }

      setSuccessMsg("Vote recorded!");
      // Refresh the current route to update counts/options, etc.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cast vote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearVotes = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be signed in to clear your vote.");
        return;
      }
      // RLS restricts delete to own votes
      const { error: delErr } = await supabase
        .from("votes")
        .delete()
        .eq("poll_id", pollId);

      if (delErr) {
        setError(delErr.message || "Failed to remove vote(s).");
        return;
      }
      setSelected([]);
      setSuccessMsg("Your vote(s) were removed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove vote(s).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitVote} className="space-y-4">
      {disabled && (
        <div className="text-sm text-muted-foreground">
          {!isActive ? "Voting is disabled because this poll is inactive." : "Voting is disabled because this poll has expired."}
        </div>
      )}
      <div className="space-y-3">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-3 rounded-md border border-input bg-card px-3 py-2 cursor-pointer">
            <Input
              type={allowMultipleChoices ? "checkbox" : "radio"}
              name="vote-option"
              checked={selected.includes(opt.id)}
              onChange={() => toggleSelection(opt.id)}
              className="h-4 w-4"
              disabled={disabled || isSubmitting}
            />
            <span className="text-foreground">{opt.text}</span>
          </label>
        ))}
      </div>

      {error && (
        <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 px-3 py-2 rounded">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="text-sm text-green-700 border border-green-300 bg-green-50 px-3 py-2 rounded">
          {successMsg}
        </div>
      )}

      <div className="pt-2 flex gap-2">
        <Button type="submit" disabled={isSubmitting || disabled} className="cursor-pointer">
          {isSubmitting ? "Submitting..." : "Submit Vote"}
        </Button>
        {selected.length > 0 && !disabled && (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleClearVotes}
          >
            Clear my vote(s)
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {allowMultipleChoices ? "You can select multiple options." : "Single selection only."}
      </div>
    </form>
  );
}

export default VotePanel;
