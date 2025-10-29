import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSidebar } from "@/components/AppSidebar";
import { NewChatDialog } from "@/components/NewChatDialog";
import Chat from "@/pages/Chat";
import { useState, useEffect } from "react";
import { Conversation, AIModel, ModelSettings } from "@shared/schema";
import { storage } from "@/lib/storage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="*" component={HomePage} />
    </Switch>
  );
}

function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = () => {
    try {
      const convs = storage.getConversations();
      setConversations(convs);
      if (convs.length === 0) {
        // Show dialog for initial conversation
        setNewChatDialogOpen(true);
      } else {
        setSelectedConvId(convs[0].id);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvId);

  const handleNewChatClick = () => {
    setNewChatDialogOpen(true);
  };

  const handleCreateChat = (model: AIModel, settings?: ModelSettings) => {
    try {
      const newConv = storage.createConversation(model, settings);
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleDeleteConversation = (id: string) => {
    try {
      storage.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConvId === id && conversations.length > 1) {
        const remaining = conversations.filter((c) => c.id !== id);
        setSelectedConvId(remaining[0]?.id);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    try {
      storage.updateConversation(id, { title: newTitle });
      const convs = storage.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Error renaming conversation:", error);
    }
  };

  const handleConversationUpdate = () => {
    // Reload conversations from localStorage when messages are added
    const convs = storage.getConversations();
    setConversations(convs);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen w-full">
        <AppSidebar
          conversations={conversations}
          selectedConversation={selectedConvId}
          onNewChat={handleNewChatClick}
          onSelectConversation={setSelectedConvId}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />
        <div className="flex-1">
          <Chat
            conversation={selectedConversation}
            selectedModel={selectedConversation?.model || "gpt-5"}
            onConversationUpdate={handleConversationUpdate}
          />
        </div>
      </div>
      <NewChatDialog
        open={newChatDialogOpen}
        onOpenChange={setNewChatDialogOpen}
        onSelectModel={handleCreateChat}
      />
    </>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "20rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <Router />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
