import { Bot, User, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "@shared/schema";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex gap-4 px-6 py-6 ${isUser ? "ml-auto max-w-3xl" : "mr-auto max-w-3xl"}`}
      data-testid={`message-${message.role}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        {isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>

      <div className="flex-1 space-y-3">
        {message.content.map((content, idx) => (
          <div key={idx}>
            {content.type === "text" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    code: ({ inline, children, ...props }: any) => {
                      if (inline) {
                        return (
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <div className="relative group/code">
                          <pre className="overflow-x-auto rounded-md bg-muted p-4">
                            <code className="font-mono text-sm" {...props}>
                              {children}
                            </code>
                          </pre>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover/code:opacity-100"
                            onClick={() => handleCopy(String(children))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    },
                  }}
                >
                  {content.text}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="relative max-w-md group/image">
                <img
                  src={content.url}
                  alt={content.alt || "Изображение"}
                  className="rounded-lg"
                  data-testid="message-image"
                />
                <div className="absolute right-2 top-2 flex gap-2 opacity-0 group-hover/image:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => window.open(content.url, "_blank")}
                    data-testid="button-view-image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {!isUser && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const text = message.content
                  .filter((c) => c.type === "text")
                  .map((c) => (c as any).text)
                  .join("\n");
                handleCopy(text);
              }}
              data-testid="button-copy-message"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {copied && (
              <span className="text-xs text-muted-foreground">Скопировано!</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
