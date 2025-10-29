import { MessageSquare, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@shared/schema";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onRename,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleRename = () => {
    if (editingId && editTitle.trim() && onRename) {
      onRename(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle("");
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, "dd.MM.yyyy HH:mm", { locale: ru });
  };
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
    <>
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
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="truncate text-sm w-full">{conv.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(conv.createdAt)}
                        </span>
                      </div>
                    </Button>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      {onRename && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(conv.id);
                            setEditTitle(conv.title);
                          }}
                          data-testid={`button-edit-${conv.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        data-testid={`button-delete-${conv.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent data-testid="dialog-rename-conversation">
          <DialogHeader>
            <DialogTitle>Переименовать чат</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Введите новое название"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRename();
              }
            }}
            data-testid="input-rename-title"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)} data-testid="button-cancel-rename">
              Отмена
            </Button>
            <Button onClick={handleRename} data-testid="button-confirm-rename">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
