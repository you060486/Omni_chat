import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AIModel, ModelSettings, ReasoningEffort } from "@shared/schema";
import { Check, ChevronDown } from "lucide-react";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectModel: (model: AIModel, settings?: ModelSettings) => void;
}

const models: { value: AIModel; label: string; description: string }[] = [
  {
    value: "gpt-5",
    label: "GPT-5",
    description: "Самая умная модель с конфигурируемым рассуждением",
  },
  {
    value: "gpt-5-mini",
    label: "GPT-5 Mini",
    description: "Быстрая версия с балансом производительности и стоимости",
  },
  {
    value: "o3-mini",
    label: "o3-mini",
    description: "Специализация на STEM: наука, математика, программирование",
  },
  {
    value: "gemini",
    label: "Gemini",
    description: "Мультимодальная модель Google (Gemini 2.5 Pro)",
  },
];

export function NewChatDialog({ open, onOpenChange, onSelectModel }: NewChatDialogProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt-5");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Settings state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(1);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
  const [topP, setTopP] = useState(1);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("medium");

  const handleConfirm = () => {
    const settings: ModelSettings = {};
    
    if (systemPrompt) settings.systemPrompt = systemPrompt;
    if (temperature !== 1) settings.temperature = temperature;
    if (maxTokens) settings.maxTokens = maxTokens;
    if (topP !== 1) settings.topP = topP;
    if (selectedModel === "o3-mini") settings.reasoningEffort = reasoningEffort;
    
    onSelectModel(selectedModel, Object.keys(settings).length > 0 ? settings : undefined);
    onOpenChange(false);
    
    // Reset settings
    setSystemPrompt("");
    setTemperature(1);
    setMaxTokens(undefined);
    setTopP(1);
    setReasoningEffort("medium");
    setShowAdvanced(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-new-chat">
        <DialogHeader>
          <DialogTitle>Создать новый чат</DialogTitle>
          <DialogDescription>
            Выберите AI модель и настройте параметры
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Model Selection */}
          <div className="space-y-2">
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

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                data-testid="button-toggle-advanced"
              >
                <span>Дополнительные настройки</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="system-prompt">Системный промпт</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="Вы - полезный AI ассистент..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-20 resize-none"
                  data-testid="input-system-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  Определяет поведение и стиль ответов модели
                </p>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Температура: {temperature.toFixed(2)}</Label>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={(v) => setTemperature(v[0])}
                  min={0}
                  max={2}
                  step={0.01}
                  data-testid="slider-temperature"
                />
                <p className="text-xs text-muted-foreground">
                  Контролирует креативность (0 = точный, 2 = креативный)
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="max-tokens">Максимум токенов</Label>
                <input
                  id="max-tokens"
                  type="number"
                  placeholder="Не ограничено"
                  value={maxTokens || ""}
                  onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  min="1"
                  max="32000"
                  data-testid="input-max-tokens"
                />
                <p className="text-xs text-muted-foreground">
                  Максимальная длина ответа (пусто = без ограничений)
                </p>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Top P: {topP.toFixed(2)}</Label>
                </div>
                <Slider
                  value={[topP]}
                  onValueChange={(v) => setTopP(v[0])}
                  min={0}
                  max={1}
                  step={0.01}
                  data-testid="slider-top-p"
                />
                <p className="text-xs text-muted-foreground">
                  Nucleus sampling (обычно используется вместо temperature)
                </p>
              </div>

              {/* Reasoning Effort (только для o3-mini) */}
              {selectedModel === "o3-mini" && (
                <div className="space-y-2">
                  <Label>Усилие рассуждения</Label>
                  <Select
                    value={reasoningEffort}
                    onValueChange={(v) => setReasoningEffort(v as ReasoningEffort)}
                  >
                    <SelectTrigger data-testid="select-reasoning-effort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Быстро</SelectItem>
                      <SelectItem value="medium">Medium - Сбалансировано</SelectItem>
                      <SelectItem value="high">High - Глубокий анализ</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Определяет глубину рассуждений модели o3-mini
                  </p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
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
