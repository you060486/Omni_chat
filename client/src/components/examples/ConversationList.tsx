import { useState } from "react";
import { ConversationList } from "../ConversationList";
import { Conversation } from "@shared/schema";

// todo: remove mock functionality
const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Разработка веб-приложения на React",
    messages: [],
    model: "gpt-5",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Помощь с Python алгоритмами",
    messages: [],
    model: "gpt-5-mini",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: "3",
    title: "Генерация изображений для проекта",
    messages: [],
    model: "gemini",
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: "4",
    title: "Советы по оптимизации базы данных",
    messages: [],
    model: "o3-mini",
    createdAt: new Date(Date.now() - 86400000 * 10),
    updatedAt: new Date(Date.now() - 86400000 * 10),
  },
];

export default function ConversationListExample() {
  const [selected, setSelected] = useState<string>();
  const [conversations, setConversations] = useState(mockConversations);

  return (
    <div className="h-96 w-64 border-r bg-sidebar">
      <ConversationList
        conversations={conversations}
        selectedId={selected}
        onSelect={setSelected}
        onDelete={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          console.log("Deleted conversation:", id);
        }}
      />
    </div>
  );
}
