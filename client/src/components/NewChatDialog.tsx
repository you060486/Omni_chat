import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AIModel } from "@shared/schema";
import { Check } from "lucide-react";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectModel: (model: AIModel) => void;
}

const models: { value: AIModel; label: string; description: string }[] = [
  {
    value: "gpt-5",
    label: "GPT-5",
    description: "Самая продвинутая модель OpenAI (GPT-4o)",
  },
  {
    value: "gpt-5-mini",
    label: "GPT-5 Mini",
    description: "Быстрая и эффективная версия (GPT-4o-mini)",
  },
  {
    value: "o3-mini",
    label: "o3-mini",
    description: "Модель с продвинутым рассуждением (GPT-4o-mini)",
  },
  {
    value: "gemini",
    label: "Gemini",
    description: "Мультимодальная модель Google (Gemini 2.0 Flash Exp)",
  },
];

export function NewChatDialog({ open, onOpenChange, onSelectModel }: NewChatDialogProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt-5");

  const handleConfirm = () => {
    onSelectModel(selectedModel);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-new-chat">
        <DialogHeader>
          <DialogTitle>Создать новый чат</DialogTitle>
          <DialogDescription>
            Выберите AI модель для нового разговора
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={() => setSelectedModel(model.value)}
              className={`w-full rounded-md border p-4 text-left transition-colors hover-elevate ${
                selectedModel === model.value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              data-testid={`button-select-model-${model.value}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{model.label}</h3>
                    {selectedModel === model.value && (
                      <Check className="h-4 w-4 text-primary" data-testid={`icon-selected-${model.value}`} />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {model.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-new-chat"
          >
            Отмена
          </Button>
          <Button onClick={handleConfirm} data-testid="button-confirm-new-chat">
            Создать чат
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
