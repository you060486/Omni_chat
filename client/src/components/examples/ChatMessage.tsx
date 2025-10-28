import { ChatMessage } from "../ChatMessage";
import { Message } from "@shared/schema";

const userMessage: Message = {
  id: "1",
  role: "user",
  content: [{ type: "text", text: "Привет! Можешь написать простой пример кода на Python?" }],
  timestamp: new Date(),
};

const assistantMessage: Message = {
  id: "2",
  role: "assistant",
  content: [
    {
      type: "text",
      text: "Конечно! Вот простой пример:\n\n```python\ndef greet(name):\n    return f'Привет, {name}!'\n\nprint(greet('Мир'))\n```\n\nЭтот код определяет функцию приветствия и выводит результат.",
    },
  ],
  model: "gpt-5",
  timestamp: new Date(),
};

export default function ChatMessageExample() {
  return (
    <div className="space-y-0">
      <ChatMessage message={userMessage} />
      <ChatMessage message={assistantMessage} />
    </div>
  );
}
