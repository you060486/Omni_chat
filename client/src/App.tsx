import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AppSidebar } from "@/components/AppSidebar";
import { NewChatDialog } from "@/components/NewChatDialog";
import { ImageGenerator } from "@/components/ImageGenerator";
import AuthPage from "@/pages/AuthPage";
import Chat from "@/pages/Chat";
import AdminPanel from "@/pages/AdminPanel";
import { useState, useEffect, useRef } from "react";
import { Conversation, AIModel, ModelSettings } from "@shared/schema";
import { storage } from "@/lib/storage";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <Route path="/auth" component={AuthPage} />
    </Switch>
  );
}

function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [imageGenOpen, setImageGenOpen] = useState(false);
  const { setOpenMobile, openMobile } = useSidebar();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await storage.getConversations();
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

  const handleCreateChat = async (model: AIModel, settings?: ModelSettings) => {
    try {
      const newConv = await storage.createConversation(model, settings);
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await storage.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConvId === id && conversations.length > 1) {
        const remaining = conversations.filter((c) => c.id !== id);
        setSelectedConvId(remaining[0]?.id);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await storage.updateConversation(id, { title: newTitle });
      const convs = await storage.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Error renaming conversation:", error);
    }
  };

  const handleConversationUpdate = async () => {
    // Reload conversations from API when messages are added
    const convs = await storage.getConversations();
    setConversations(convs);
  };

  const handleImageGenClick = () => {
    setImageGenOpen(true);
  };

  const handleImageGenerated = async (url: string) => {
    if (!selectedConvId) return;
    // Send generated image as a message
    const conversation = conversations.find((c) => c.id === selectedConvId);
    if (conversation) {
      const userMessage = {
        role: "user" as const,
        content: [{ type: "image" as const, url }],
        timestamp: new Date(),
      };
      await storage.addMessage(selectedConvId, userMessage);
      await handleConversationUpdate();
    }
  };

  // Touch event handlers for swipe from edge
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only activate swipe if sidebar is closed
      if (openMobile) return;
      
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current || openMobile) return;
      
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX.current;
      const deltaY = touchY - touchStartY.current;
      
      // Check if swipe started from left edge (within 20px)
      if (touchStartX.current < 20 && deltaX > 50 && Math.abs(deltaY) < 100) {
        setOpenMobile(true);
        touchStartX.current = 0;
      }
    };

    const handleTouchEnd = () => {
      touchStartX.current = 0;
      touchStartY.current = 0;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove);
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [setOpenMobile, openMobile]);

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
      <div className="flex h-screen w-full overflow-hidden" ref={containerRef}>
        <AppSidebar
          conversations={conversations}
          selectedConversation={selectedConvId}
          onNewChat={handleNewChatClick}
          onImageGen={handleImageGenClick}
          onSelectConversation={setSelectedConvId}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />
        <div className="flex-1 overflow-hidden">
          <Chat
            conversation={selectedConversation}
            selectedModel={selectedConversation?.model || "gpt-5"}
            onConversationUpdate={handleConversationUpdate}
            onImageGenerated={handleImageGenerated}
          />
        </div>
      </div>
      <NewChatDialog
        open={newChatDialogOpen}
        onOpenChange={setNewChatDialogOpen}
        onSelectModel={handleCreateChat}
      />
      <ImageGenerator
        open={imageGenOpen}
        onOpenChange={setImageGenOpen}
        onImageGenerated={handleImageGenerated}
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
          <AuthProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <Router />
              <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
