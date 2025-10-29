import { useState, useEffect } from "react";
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
import { ModelSettings, ReasoningEffort, AIModel } from "@shared/schema";

interface EditSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: ModelSettings;
  currentModel: AIModel;
  onSave: (settings: ModelSettings) => void;
}

export function EditSettingsDialog({
  open,
  onOpenChange,
  currentSettings,
  currentModel,
  onSave,
}: EditSettingsDialogProps) {
  const [systemPrompt, setSystemPrompt] = useState(currentSettings.systemPrompt || "");
  const [temperature, setTemperature] = useState(currentSettings.temperature ?? 1);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(currentSettings.maxTokens);
  const [topP, setTopP] = useState(currentSettings.topP ?? 1);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(
    currentSettings.reasoningEffort || "medium"
  );

  useEffect(() => {
    if (open) {
      setSystemPrompt(currentSettings.systemPrompt || "");
      setTemperature(currentSettings.temperature ?? 1);
      setMaxTokens(currentSettings.maxTokens);
      setTopP(currentSettings.topP ?? 1);
      setReasoningEffort(currentSettings.reasoningEffort || "medium");
    }
  }, [open, currentSettings]);

  const handleSave = () => {
    const settings: ModelSettings = {};
    
    if (systemPrompt) settings.systemPrompt = systemPrompt;
    if (temperature !== 1) settings.temperature = temperature;
    if (maxTokens) settings.maxTokens = maxTokens;
    if (topP !== 1) settings.topP = topP;
    if (currentModel === "o3-mini") settings.reasoningEffort = reasoningEffort;
    
    onSave(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-settings">
        <DialogHeader>
          <DialogTitle>Настройки модели</DialogTitle>
          <DialogDescription>
            Изменение настроек применится к текущему диалогу
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="edit-system-prompt">Системный промпт</Label>
            <Textarea
              id="edit-system-prompt"
              placeholder="Вы - полезный AI ассистент..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-24 resize-none"
              data-testid="input-edit-system-prompt"
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
              data-testid="slider-edit-temperature"
            />
            <p className="text-xs text-muted-foreground">
              Контролирует креативность (0 = точный, 2 = креативный)
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label htmlFor="edit-max-tokens">Максимум токенов</Label>
            <input
              id="edit-max-tokens"
              type="number"
              placeholder="Не ограничено"
              value={maxTokens || ""}
              onChange={(e) =>
                setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              min="1"
              max="32000"
              data-testid="input-edit-max-tokens"
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
              data-testid="slider-edit-top-p"
            />
            <p className="text-xs text-muted-foreground">
              Nucleus sampling (обычно используется вместо temperature)
            </p>
          </div>

          {/* Reasoning Effort (только для o3-mini) */}
          {currentModel === "o3-mini" && (
            <div className="space-y-2">
              <Label>Усилие рассуждения</Label>
              <Select
                value={reasoningEffort}
                onValueChange={(v) => setReasoningEffort(v as ReasoningEffort)}
              >
                <SelectTrigger data-testid="select-edit-reasoning-effort">
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
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit-settings"
          >
            Отмена
          </Button>
          <Button onClick={handleSave} data-testid="button-save-settings">
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
