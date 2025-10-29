import { PlusCircle, Sparkles, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ConversationList } from "./ConversationList";
import { Conversation } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

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
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleAdminClick = () => {
    setLocation("/admin");
  };

  const handleHomeClick = () => {
    setLocation("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4 space-y-2">
        <Button
          className="w-full justify-start gap-2"
          onClick={handleHomeClick}
          variant="ghost"
          data-testid="button-home"
        >
          <User className="h-5 w-5" />
          <span>Главная</span>
        </Button>
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
        {user?.username === "admin" && (
          <Button
            className="w-full justify-start gap-2"
            variant="outline"
            onClick={handleAdminClick}
            data-testid="button-admin-panel"
          >
            <Settings className="h-5 w-5" />
            <span>Админ-панель</span>
          </Button>
        )}
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
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2 mb-2 px-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground" data-testid="text-username">
            {user?.username}
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span>{logoutMutation.isPending ? "Выход..." : "Выйти"}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
