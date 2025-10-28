import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSidebar } from "@/components/AppSidebar";
import Chat from "@/pages/Chat";
import { useState } from "react";
import { Conversation, AIModel, Message } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="*" component={HomePage} />
    </Switch>
  );
}

function HomePage() {
  // todo: remove mock functionality
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Новый чат",
      messages: [],
      model: "gpt-5",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  const [selectedConvId, setSelectedConvId] = useState<string>("1");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt-5");

  const selectedConversation = conversations.find((c) => c.id === selectedConvId);

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "Новый чат",
      messages: [],
      model: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedConvId === id && conversations.length > 1) {
      const remaining = conversations.filter((c) => c.id !== id);
      setSelectedConvId(remaining[0]?.id);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar
        conversations={conversations}
        selectedConversation={selectedConvId}
        selectedModel={selectedModel}
        onNewChat={handleNewChat}
        onSelectConversation={setSelectedConvId}
        onDeleteConversation={handleDeleteConversation}
        onModelChange={setSelectedModel}
      />
      <div className="flex-1">
        <Chat
          conversation={selectedConversation}
          selectedModel={selectedModel}
        />
      </div>
    </div>
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
