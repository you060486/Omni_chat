import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

interface VoiceInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscript: (text: string) => void;
}

export function VoiceInput({ open, onOpenChange, onTranscript }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (!open) {
      setIsRecording(false);
      setTranscript("");
    }
  }, [open]);

  const startRecording = () => {
    setIsRecording(true);
    
    // Web Speech API
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "ru-RU";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      // Fallback для демонстрации
      setTimeout(() => {
        setTranscript("Это демонстрационный текст. Распознавание речи не поддерживается в этом браузере.");
        setIsRecording(false);
      }, 2000);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const handleSend = () => {
    if (transcript) {
      onTranscript(transcript);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-voice-input">
        <DialogHeader>
          <DialogTitle>Голосовой ввод</DialogTitle>
          <DialogDescription>
            Нажмите на микрофон и начните говорить
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-6">
          {isRecording ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/20 animate-pulse">
                <Mic className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Слушаю...</p>
              <Button
                variant="outline"
                onClick={stopRecording}
                data-testid="button-stop-recording"
              >
                <Square className="mr-2 h-4 w-4" />
                Остановить
              </Button>
            </div>
          ) : transcript ? (
            <div className="w-full space-y-4">
              <div className="rounded-lg border bg-muted p-4">
                <p className="text-sm">{transcript}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setTranscript("")}
                  data-testid="button-retry-recording"
                >
                  Повторить
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSend}
                  data-testid="button-send-transcript"
                >
                  Отправить
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                size="icon"
                className="h-24 w-24 rounded-full"
                onClick={startRecording}
                data-testid="button-start-recording"
              >
                <Mic className="h-12 w-12" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Нажмите, чтобы начать запись
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
