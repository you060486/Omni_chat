import { Send, Paperclip, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, KeyboardEvent, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (text: string, files?: File[], images?: string[]) => void;
  onVoiceClick: () => void;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onVoiceClick,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = window.innerWidth < 768 
        ? window.innerHeight * 0.7 
        : window.innerHeight * 0.5;
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() || attachedFiles.length > 0 || attachedImages.length > 0) {
      onSendMessage(message, attachedFiles, attachedImages);
      setMessage("");
      setAttachedFiles([]);
      setAttachedImages([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="shrink-0 border-t bg-background px-6 py-4">
      <div className="mx-auto max-w-3xl">
        {(attachedFiles.length > 0 || attachedImages.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedImages.map((img, idx) => (
              <div key={`img-${idx}`} className="relative h-20 w-20" data-testid={`attached-image-${idx}`}>
                <img
                  src={img}
                  alt={`Preview ${idx}`}
                  className="h-full w-full rounded-md object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={() => removeImage(idx)}
                  data-testid={`button-remove-image-${idx}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {attachedFiles.map((file, idx) => (
              <div
                key={`file-${idx}`}
                className="flex h-20 items-center gap-2 rounded-md border bg-muted px-3"
                data-testid={`attached-file-${idx}`}
              >
                <Paperclip className="h-4 w-4" />
                <span className="max-w-32 truncate text-sm">{file.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => removeFile(idx)}
                  data-testid={`button-remove-file-${idx}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.doc,.docx"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              const imageFiles: File[] = [];
              const otherFiles: File[] = [];
              
              files.forEach((file) => {
                if (file.type.startsWith('image/')) {
                  imageFiles.push(file);
                } else {
                  otherFiles.push(file);
                }
              });
              
              if (imageFiles.length > 0) {
                imageFiles.forEach((file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    if (e.target?.result) {
                      setAttachedImages((prev) => [...prev, e.target!.result as string]);
                    }
                  };
                  reader.readAsDataURL(file);
                });
              }
              
              if (otherFiles.length > 0) {
                setAttachedFiles((prev) => [...prev, ...otherFiles]);
              }
            }}
          />

          <Button
            size="icon"
            variant="ghost"
            onClick={handleAttachClick}
            disabled={disabled}
            data-testid="button-attach"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className="min-h-[3rem] resize-none overflow-hidden flex-1"
            style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '70vh' : '50vh' }}
            disabled={disabled}
            data-testid="input-message"
          />

          {message.trim() || attachedFiles.length > 0 || attachedImages.length > 0 ? (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={disabled}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={onVoiceClick}
              disabled={disabled}
              data-testid="button-voice-input"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground hidden md:block">
          Ctrl+Enter для отправки
        </p>
      </div>
    </div>
  );
}
