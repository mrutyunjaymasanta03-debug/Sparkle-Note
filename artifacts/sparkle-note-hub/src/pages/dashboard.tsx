import { useState } from "react";
import { useListNotes, getListNotesQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { NoteCard } from "@/components/note-card";
import { NoteDialog } from "@/components/note-dialog";
import { StatsPanel } from "@/components/stats-panel";
import { TagsSidebar } from "@/components/tags-sidebar";
import { RecentNotes } from "@/components/recent-notes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Sparkles, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const { data: notes, isLoading } = useListNotes(
    { search: debouncedSearch, tag: selectedTag, pinned: showPinnedOnly || undefined },
    { query: { queryKey: getListNotesQueryKey({ search: debouncedSearch, tag: selectedTag, pinned: showPinnedOnly || undefined }) } }
  );

  const handleCreateNote = () => {
    setEditingNoteId(null);
    setIsDialogOpen(true);
  };

  const handleEditNote = (id: string) => {
    setEditingNoteId(id);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-3 rounded-2xl">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight">Sparkle Note Hub</h1>
              <p className="text-muted-foreground text-sm">Your quiet space for thoughts and ideas</p>
            </div>
          </div>
          
          <Button onClick={handleCreateNote} size="lg" className="rounded-full shadow-sm hover:shadow-md transition-all">
            <Plus className="mr-2 h-5 w-5" /> New Note
          </Button>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
            <TagsSidebar selectedTag={selectedTag} onSelectTag={setSelectedTag} />
            <RecentNotes onNoteClick={handleEditNote} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col gap-8 min-w-0">
            <StatsPanel />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/40 p-2 rounded-2xl backdrop-blur-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white border-0 shadow-sm rounded-xl h-11 focus-visible:ring-1"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant={showPinnedOnly ? "default" : "ghost"}
                  className="rounded-xl px-4"
                  onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                >
                  Pinned
                </Button>
                {selectedTag && (
                  <Button
                    variant="secondary"
                    className="rounded-xl px-4 ml-auto sm:ml-0"
                    onClick={() => setSelectedTag(undefined)}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <motion.div key={`skeleton-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Skeleton className="h-64 rounded-2xl w-full" />
                    </motion.div>
                  ))
                ) : notes?.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/30 rounded-3xl backdrop-blur-sm"
                  >
                    <div className="bg-primary/10 p-6 rounded-full mb-6">
                      <FileText className="h-12 w-12 text-primary/60" />
                    </div>
                    <h3 className="text-2xl font-serif mb-2">No notes found</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {search || selectedTag || showPinnedOnly
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "Your workspace is empty. Create a new note to start capturing your ideas."}
                    </p>
                    {!(search || selectedTag || showPinnedOnly) && (
                      <Button onClick={handleCreateNote} variant="outline" className="mt-6 rounded-full bg-white border-0 shadow-sm hover:shadow-md">
                        Create your first note
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  notes?.map((note, index) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="h-full"
                    >
                      <NoteCard
                        note={note}
                        onClick={handleEditNote}
                        onTagClick={setSelectedTag}
                      />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <NoteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        noteId={editingNoteId}
      />
    </div>
  );
}
