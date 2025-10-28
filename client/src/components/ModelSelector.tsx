import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIModel } from "@shared/schema";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const models: { id: AIModel; name: string; description: string }[] = [
  { id: "gpt-5", name: "GPT-5", description: "Наиболее способная модель" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", description: "Быстрая и эффективная" },
  { id: "o3-mini", name: "o3-mini", description: "Продвинутое рассуждение" },
  { id: "gemini", name: "Gemini", description: "Мультимодальная модель Google" },
];

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const currentModel = models.find((m) => m.id === selectedModel);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="justify-start gap-2 font-medium"
          data-testid="button-model-selector"
        >
          <span className="text-sm">{currentModel?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className="flex items-start gap-3 py-3"
            data-testid={`model-option-${model.id}`}
          >
            <div className="flex h-5 items-center">
              {selectedModel === model.id && <Check className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="font-medium">{model.name}</div>
              <div className="text-xs text-muted-foreground">
                {model.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
