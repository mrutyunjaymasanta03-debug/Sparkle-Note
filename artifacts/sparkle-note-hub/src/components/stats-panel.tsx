import { useGetNoteStats, getGetNoteStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Pin, Tags, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsPanel() {
  const { data: stats, isLoading } = useGetNoteStats({
    query: { queryKey: getGetNoteStatsQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    { label: "Total Notes", value: stats.total, icon: FileText, color: "bg-blue-50 text-blue-500" },
    { label: "Pinned", value: stats.pinned, icon: Pin, color: "bg-pink-50 text-pink-500" },
    { label: "With Tags", value: stats.withTags, icon: Tags, color: "bg-green-50 text-green-500" },
    { label: "Recent Activity", value: stats.recentCount, icon: Activity, color: "bg-orange-50 text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-serif font-medium">{item.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
