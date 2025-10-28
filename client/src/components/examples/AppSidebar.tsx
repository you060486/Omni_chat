import { useState } from "react";
import { AppSidebar } from "../AppSidebar";
import { Conversation, AIModel } from "@shared/schema";
import { SidebarProvider } from "@/components/ui/sidebar";

// todo: remove mock functionality
const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Разработка веб-приложения",
    messages: [],
    model: "gpt-5",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Помощь с алгоритмами",
    messages: [],
    model: "gpt-5-mini",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
];

export default function AppSidebarExample() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selected, setSelected] = useState<string>();
  const [model, setModel] = useState<AIModel>("gpt-5");

  const style = {
    "--sidebar-width": "20rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-96 w-full">
        <AppSidebar
          conversations={conversations}
          selectedConversation={selected}
          selectedModel={model}
          onNewChat={() => console.log("New chat")}
          onSelectConversation={setSelected}
          onDeleteConversation={(id) => {
            setConversations((prev) => prev.filter((c) => c.id !== id));
          }}
          onModelChange={setModel}
        />
        <div className="flex-1 bg-background" />
      </div>
    </SidebarProvider>
  );
}
