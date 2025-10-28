import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ConversationList } from "./ConversationList";
import { ModelSelector } from "./ModelSelector";
import { Conversation, AIModel } from "@shared/schema";

interface AppSidebarProps {
  conversations: Conversation[];
  selectedConversation?: string;
  selectedModel: AIModel;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onModelChange: (model: AIModel) => void;
}

export function AppSidebar({
  conversations,
  selectedConversation,
  selectedModel,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onModelChange,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="space-y-3">
          <Button
            className="w-full justify-start gap-2"
            onClick={onNewChat}
            data-testid="button-new-chat"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Новый чат</span>
          </Button>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
