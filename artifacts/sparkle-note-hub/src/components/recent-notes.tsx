import { useGetRecentNotes, getGetRecentNotesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentNotesProps {
  onNoteClick: (id: string) => void;
}

export function RecentNotes({ onNoteClick }: RecentNotesProps) {
  const { data: recentNotes, isLoading } = useGetRecentNotes({
    query: { queryKey: getGetRecentNotesQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-white/40 rounded-2xl">
        <Skeleton className="h-6 w-32 mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!recentNotes || recentNotes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/40 rounded-2xl p-4">
      <h3 className="font-serif text-lg mb-4 flex items-center gap-2 px-2 text-foreground/80">
        <Clock className="h-4 w-4" /> Recently Modified
      </h3>
      <div className="flex flex-col gap-1">
        {recentNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => onNoteClick(note.id)}
            className="text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 flex flex-col group"
          >
            <span className="font-medium truncate w-full group-hover:text-primary transition-colors">
              {note.title || "Untitled"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
