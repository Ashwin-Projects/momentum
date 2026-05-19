import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudySessions, createStudySession, deleteStudySession } from "../api/study";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { BookOpen, Plus, Trash2, Clock, TrendingUp, GraduationCap } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatTime, getToday } from "../lib/utils";

export default function Study() {
  const queryClient = useQueryClient();
  const today = getToday();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    durationMinutes: 30,
    notes: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["study", today],
    queryFn: () => getStudySessions(today),
  });

  const createMutation = useMutation({
    mutationFn: createStudySession,
    onSuccess: () => {
      queryClient.invalidateQueries(["study"]);
      queryClient.invalidateQueries(["targets"]);
      setIsOpen(false);
      setFormData({ subject: "", durationMinutes: 30, notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudySession,
    onSuccess: () => {
      queryClient.invalidateQueries(["study"]);
      queryClient.invalidateQueries(["targets"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, startedAt: new Date().toISOString() });
  };

  if (isLoading) return <LoadingSpinner />;

  const sessions = data?.data || [];
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const avgFocus = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / sessions.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Study Tracking</h1>
          <p className="mt-1 text-zinc-400">Log your study sessions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Study Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What did you learn?"
                />
              </div>
              <Button type="submit" className="w-full">Log Session</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{formatTime(totalMinutes)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{sessions.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">
                {new Set(sessions.map((s) => s.subject)).size}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-2 border-dashed border-white/[0.08]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCap className="mb-4 h-8 w-8 text-zinc-500" />
            <p className="mb-2 text-lg text-zinc-300">No study sessions logged today</p>
            <p className="mb-6 text-sm text-zinc-400">Start tracking your learning progress</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Your First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              Today's Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#161616] p-4 transition-colors hover:bg-[#1b1b1b]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.subject}</p>
                    <p className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {session.durationMinutes} min
                      {session.notes && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="truncate">{session.notes}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 shrink-0 hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(session.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
