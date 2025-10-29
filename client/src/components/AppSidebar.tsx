import { PlusCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ConversationList } from "./ConversationList";
import { Conversation } from "@shared/schema";

interface AppSidebarProps {
  conversations: Conversation[];
  selectedConversation?: string;
  onNewChat: () => void;
  onImageGen: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
}

export function AppSidebar({
  conversations,
  selectedConversation,
  onNewChat,
  onImageGen,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4 space-y-2">
        <Button
          className="w-full justify-start gap-2"
          onClick={onNewChat}
          data-testid="button-new-chat"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Новый чат</span>
        </Button>
        <Button
          className="w-full justify-start gap-2"
          variant="secondary"
          onClick={onImageGen}
          data-testid="button-image-generation"
        >
          <Sparkles className="h-5 w-5" />
          <span>Генерация изображения</span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
              onRename={onRenameConversation}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
