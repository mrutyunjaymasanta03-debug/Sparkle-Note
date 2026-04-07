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
import { useCreateNote, useUpdateNote, useGetNote, getListNotesQueryKey, getGetNoteStatsQueryKey, getGetAllTagsQueryKey, getGetRecentNotesQueryKey, getGetNoteQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const NOTE_COLORS = [
  "#ffffff", // White
  "#fef3c7", // Warm yellow
  "#fee2e2", // Soft red
  "#ffedd5", // Soft orange
  "#dcfce7", // Soft green
  "#e0e7ff", // Soft blue
  "#f3e8ff", // Soft indigo
  "#fae8ff", // Soft purple
  "#fce7f3", // Soft pink
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
  const [tagInput, setTagInput] = useState("");

  const { data: note, isLoading: isLoadingNote } = useGetNote(noteId || "", {
    query: {
      enabled: isEditing && open,
      queryKey: noteId ? getGetNoteQueryKey(noteId) : ["null"],
    }
  });

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
    }
  }, [open, isEditing, note, form]);

  const onSubmit = (data: NoteFormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAllTagsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentNotesQueryKey() });
      onOpenChange(false);
    };

    if (isEditing && noteId) {
      updateNote.mutate(
        { id: noteId, data },
        { onSuccess }
      );
    } else {
      createNote.mutate(
        { data },
        { onSuccess }
      );
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (newTag && !form.getValues("tags").includes(newTag)) {
        form.setValue("tags", [...form.getValues("tags"), newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag) => tag !== tagToRemove)
    );
  };

  const isPending = createNote.isPending || updateNote.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-0 p-0 overflow-hidden" style={{ backgroundColor: form.watch("color") }}>
        <div className="bg-white/40 backdrop-blur-xl absolute inset-0 pointer-events-none" />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10 flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh]">
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle className="sr-only">{isEditing ? "Edit Note" : "Create Note"}</DialogTitle>
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
                        className="w-full h-full min-h-[200px] resize-none bg-transparent border-0 outline-none placeholder:text-black/30 text-black/70 text-lg leading-relaxed focus-visible:ring-0 p-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-6 bg-white/40 backdrop-blur-md mt-auto shrink-0 flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-wrap gap-2 items-center">
                        {field.value.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-black/5 hover:bg-black/10 text-black/70 px-2 py-1 rounded-md border-0 font-normal">
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1.5 opacity-50 hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder="Add tags..."
                          className="h-8 w-32 bg-transparent border-0 shadow-none focus-visible:ring-0 px-1 placeholder:text-black/30 text-sm"
                        />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

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
                              field.value === color ? "scale-125 ring-2 ring-black/20 ring-offset-2 ring-offset-transparent" : "hover:scale-110"
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
                      <FormLabel className="text-sm font-normal text-black/60 cursor-pointer">Pin to top</FormLabel>
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
                <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || isLoadingNote} className="rounded-full px-8">
                  {isPending ? "Saving..." : isEditing ? "Save Note" : "Create Note"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
