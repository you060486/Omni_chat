import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@shared/schema";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ru } from "date-fns/locale";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onDelete,
}: ConversationListProps) {
  const groupConversations = () => {
    const groups: { [key: string]: Conversation[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    conversations.forEach((conv) => {
      if (isToday(conv.updatedAt)) {
        groups.today.push(conv);
      } else if (isYesterday(conv.updatedAt)) {
        groups.yesterday.push(conv);
      } else if (isThisWeek(conv.updatedAt, { locale: ru })) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groups = groupConversations();
  const groupLabels = {
    today: "Сегодня",
    yesterday: "Вчера",
    thisWeek: "На этой неделе",
    older: "Ранее",
  };

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-6 px-4 py-4">
        {Object.entries(groups).map(([key, convs]) =>
          convs.length > 0 ? (
            <div key={key}>
              <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                {groupLabels[key as keyof typeof groupLabels]}
              </h3>
              <div className="space-y-1">
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 rounded-md px-3 py-2 hover-elevate ${
                      selectedId === conv.id ? "bg-sidebar-accent" : ""
                    }`}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <Button
                      variant="ghost"
                      className="h-auto flex-1 justify-start p-0 hover:bg-transparent"
                      onClick={() => onSelect(conv.id)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate text-sm">{conv.title}</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      data-testid={`button-delete-${conv.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </ScrollArea>
  );
}
