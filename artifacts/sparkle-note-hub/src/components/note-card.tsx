import { useState } from "react";
import { format } from "date-fns";
import { Pin, Trash2, Edit3, MoreVertical } from "lucide-react";
import { Note } from "@workspace/api-client-react/src/generated/api.schemas";
import { useDeleteNote, useToggleNotePin, getListNotesQueryKey, getGetNoteStatsQueryKey, getGetAllTagsQueryKey, getGetRecentNotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onClick: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

export function NoteCard({ note, onClick, onTagClick }: NoteCardProps) {
  const queryClient = useQueryClient();
  const deleteNote = useDeleteNote();
  const togglePin = useToggleNotePin();

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin.mutate(
      { id: note.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentNotesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() });
        }
      }
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate(
        { id: note.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecentNotesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAllTagsQueryKey() });
          }
        }
      );
    }
  };

  return (
    <Card 
      className={cn(
        "group relative flex flex-col cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-0 h-full",
        !note.color && "bg-card"
      )}
      style={note.color ? { backgroundColor: note.color } : {}}
      onClick={() => onClick(note.id)}
    >
      <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-sm", note.pinned && "opacity-100 text-primary")}
          onClick={handleTogglePin}
        >
          <Pin className={cn("h-4 w-4", note.pinned && "fill-current")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onClick(note.id)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-xl font-serif pr-12 line-clamp-2 leading-tight">
          {note.title || "Untitled"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow px-5 pb-4">
        <p className="text-sm opacity-80 whitespace-pre-wrap line-clamp-6 leading-relaxed font-sans">
          {note.content}
        </p>
      </CardContent>
      
      <CardFooter className="px-5 py-4 pt-0 mt-auto flex flex-col items-start gap-3">
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 w-full">
            {note.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="bg-black/5 hover:bg-black/10 text-xs font-normal border-0 text-black/70 px-2 py-0.5 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="text-[11px] font-medium opacity-50 uppercase tracking-wider w-full">
          {format(new Date(note.updatedAt), "MMM d, yyyy")}
        </div>
      </CardFooter>
    </Card>
  );
}
