import { Send, Paperclip, Mic, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, KeyboardEvent } from "react";

interface ChatInputProps {
  onSendMessage: (text: string, files?: File[], images?: string[]) => void;
  onVoiceClick: () => void;
  onImageGenClick: () => void;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onVoiceClick,
  onImageGenClick,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || attachedFiles.length > 0 || attachedImages.length > 0) {
      onSendMessage(message, attachedFiles, attachedImages);
      setMessage("");
      setAttachedFiles([]);
      setAttachedImages([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAttachedImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="sticky bottom-0 border-t bg-background px-6 py-4">
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

        <div className="flex gap-2">
          <div className="flex gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
              data-testid="button-upload-image"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              data-testid="button-upload-file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onVoiceClick}
              disabled={disabled}
              data-testid="button-voice-input"
            >
              <Mic className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onImageGenClick}
              disabled={disabled}
              data-testid="button-generate-image"
            >
              <ImageIcon className="h-5 w-5 fill-current" />
            </Button>
          </div>

          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение... (Shift+Enter для новой строки)"
              className="min-h-[3rem] max-h-32 resize-none pr-12"
              disabled={disabled}
              data-testid="input-message"
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachedFiles.length === 0 && attachedImages.length === 0)}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter для отправки • Shift+Enter для новой строки
        </p>
      </div>
    </div>
  );
}
