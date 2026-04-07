import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  useCreateNote,
  useUpdateNote,
  useGetNote,
  useGetAllTags,
  getListNotesQueryKey,
  getGetNoteStatsQueryKey,
  getGetAllTagsQueryKey,
  getGetRecentNotesQueryKey,
  getGetNoteQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const NOTE_COLORS = [
  "#ffffff",
  "#fef3c7",
  "#fee2e2",
  "#ffedd5",
  "#dcfce7",
  "#e0e7ff",
  "#f3e8ff",
  "#fae8ff",
  "#fce7f3",
];

const noteSchema = z.object({
  title: z.string().max(100),
  content: z.string().min(1, "Content is required"),
  color: z.string(),
  tags: z.array(z.string()),
  pinned: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId?: string | null;
}

export function NoteDialog({ open, onOpenChange, noteId }: NoteDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!noteId;
  const [customTagInput, setCustomTagInput] = useState("");

  const { data: note, isLoading: isLoadingNote } = useGetNote(noteId || "", {
    query: {
      enabled: isEditing && open,
      queryKey: noteId ? getGetNoteQueryKey(noteId) : ["null"],
    },
  });

  const { data: allTagsData } = useGetAllTags({
    query: { queryKey: getGetAllTagsQueryKey() },
  });

  const existingTags = allTagsData?.map((t) => t.tag) ?? [];

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      color: "#ffffff",
      tags: [],
      pinned: false,
    },
  });

  const selectedTags = form.watch("tags");

  useEffect(() => {
    if (open && isEditing && note) {
      form.reset({
        title: note.title,
        content: note.content,
        color: note.color || "#ffffff",
        tags: note.tags || [],
        pinned: note.pinned,
      });
    } else if (open && !isEditing) {
      form.reset({
        title: "",
        content: "",
        color: "#ffffff",
        tags: [],
        pinned: false,
      });
      setCustomTagInput("");
    }
  }, [open, isEditing, note, form]);

  const toggleTag = (tag: string) => {
    const current = form.getValues("tags");
    if (current.includes(tag)) {
      form.setValue("tags", current.filter((t) => t !== tag));
    } else {
      form.setValue("tags", [...current, tag]);
    }
  };

  const addCustomTag = () => {
    const newTag = customTagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (newTag && !form.getValues("tags").includes(newTag)) {
      form.setValue("tags", [...form.getValues("tags"), newTag]);
    }
    setCustomTagInput("");
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const onSubmit = (data: NoteFormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAllTagsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentNotesQueryKey() });
      onOpenChange(false);
    };

    if (isEditing && noteId) {
      updateNote.mutate({ id: noteId, data }, { onSuccess });
    } else {
      createNote.mutate({ data }, { onSuccess });
    }
  };

  const isPending = createNote.isPending || updateNote.isPending;

  // Merge existing tags with any tags the note already has (for editing)
  const allAvailableTags = Array.from(
    new Set([...existingTags, ...selectedTags])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] border-0 p-0 overflow-hidden"
        style={{ backgroundColor: form.watch("color") }}
      >
        <div className="bg-white/40 backdrop-blur-xl absolute inset-0 pointer-events-none" />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="relative z-10 flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh]"
          >
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle className="sr-only">
                {isEditing ? "Edit Note" : "Create Note"}
              </DialogTitle>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Note Title"
                        className="w-full text-3xl font-serif font-medium bg-transparent border-0 outline-none placeholder:text-black/30 text-black/80 focus:ring-0 p-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </DialogHeader>

            <div className="px-6 py-2 flex-grow overflow-y-auto">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="h-full">
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write something wonderful..."
                        className="w-full h-full min-h-[160px] resize-none bg-transparent border-0 outline-none placeholder:text-black/30 text-black/70 text-lg leading-relaxed focus-visible:ring-0 p-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags Section */}
            <div className="px-6 pt-3 pb-1">
              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-black/40 uppercase tracking-wider mb-2 block">
                      Tags
                    </FormLabel>

                    {/* Clickable existing tags */}
                    {allAvailableTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {allAvailableTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                                isSelected
                                  ? "bg-black/70 text-white border-black/70 scale-105"
                                  : "bg-white/50 text-black/60 border-black/10 hover:bg-black/10 hover:border-black/20"
                              )}
                            >
                              {isSelected ? (
                                <span className="flex items-center gap-1">
                                  {tag}
                                  <X className="h-2.5 w-2.5" />
                                </span>
                              ) : (
                                tag
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* New custom tag input */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={handleCustomTagKeyDown}
                        placeholder="New tag..."
                        className="h-8 bg-white/40 border-black/10 shadow-none focus-visible:ring-0 text-sm rounded-lg flex-1"
                      />
                      <button
                        type="button"
                        onClick={addCustomTag}
                        disabled={!customTagInput.trim()}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 disabled:opacity-30 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="p-6 bg-white/40 backdrop-blur-md mt-2 shrink-0 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        {NOTE_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-6 h-6 rounded-full border border-black/10 transition-transform",
                              field.value === color
                                ? "scale-125 ring-2 ring-black/20 ring-offset-2 ring-offset-transparent"
                                : "hover:scale-110"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pinned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormLabel className="text-sm font-normal text-black/60 cursor-pointer">
                        Pin to top
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="sm:justify-end mt-2 pt-4 border-t border-black/5">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || isLoadingNote}
                  className="rounded-full px-8"
                >
                  {isPending
                    ? "Saving..."
                    : isEditing
                    ? "Save Note"
                    : "Create Note"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
