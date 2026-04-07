import { useGetAllTags, getGetAllTagsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsSidebarProps {
  selectedTag?: string;
  onSelectTag: (tag?: string) => void;
}

export function TagsSidebar({ selectedTag, onSelectTag }: TagsSidebarProps) {
  const { data: tags, isLoading } = useGetAllTags({
    query: { queryKey: getGetAllTagsQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-white/40 rounded-2xl">
        <Skeleton className="h-6 w-24 mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="p-6 bg-white/40 rounded-2xl text-center text-muted-foreground">
        <Hash className="h-8 w-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No tags yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white/40 rounded-2xl p-4 sticky top-6">
      <h3 className="font-serif text-lg mb-4 flex items-center gap-2 px-2 text-foreground/80">
        <Hash className="h-4 w-4" /> Tags
      </h3>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onSelectTag(undefined)}
          className={cn(
            "text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
            !selectedTag ? "bg-primary/20 font-medium text-primary-foreground" : "hover:bg-black/5"
          )}
        >
          <span>All Notes</span>
        </button>
        {tags.map((t) => (
          <button
            key={t.tag}
            onClick={() => onSelectTag(t.tag)}
            className={cn(
              "text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
              selectedTag === t.tag ? "bg-primary/20 font-medium text-primary-foreground" : "hover:bg-black/5"
            )}
          >
            <span className="truncate mr-2">#{t.tag}</span>
            <Badge variant="secondary" className={cn(
              "font-mono text-[10px] px-1.5 py-0",
              selectedTag === t.tag ? "bg-white/50 text-primary-foreground" : "bg-black/5 text-muted-foreground group-hover:bg-black/10"
            )}>
              {t.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
