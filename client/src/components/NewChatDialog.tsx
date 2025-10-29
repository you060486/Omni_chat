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
import { AIModel, ModelSettings, ReasoningEffort, PresetPrompt } from "@shared/schema";
import { Check, ChevronDown, Sparkles, Settings2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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

type ViewMode = "choice" | "presets" | "manual";

export function NewChatDialog({ open, onOpenChange, onSelectModel }: NewChatDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("choice");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt-5");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Settings state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(1);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
  const [topP, setTopP] = useState(1);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("medium");

  // Fetch current user
  const { data: currentUser } = useQuery<{ id: string; username: string }>({
    queryKey: ["/api/user"],
    enabled: open,
  });

  // Fetch approved presets (from admin)
  const { data: approvedPresets, isLoading: isLoadingApproved } = useQuery<PresetPrompt[]>({
    queryKey: ["/api/presets/approved"],
    enabled: open && viewMode === "presets",
  });

  // Fetch user's own presets
  const { data: userPresets, isLoading: isLoadingUser } = useQuery<PresetPrompt[]>({
    queryKey: ["/api/presets/user", currentUser?.id],
    enabled: open && viewMode === "presets" && !!currentUser?.id,
  });

  const isLoading = isLoadingApproved || isLoadingUser;

  const handleConfirm = () => {
    const settings: ModelSettings = {};
    
    if (systemPrompt) settings.systemPrompt = systemPrompt;
    if (temperature !== 1) settings.temperature = temperature;
    if (maxTokens) settings.maxTokens = maxTokens;
    if (topP !== 1) settings.topP = topP;
    if (selectedModel === "o3-mini") settings.reasoningEffort = reasoningEffort;
    
    onSelectModel(selectedModel, Object.keys(settings).length > 0 ? settings : undefined);
    handleClose();
  };

  const handlePresetSelect = (preset: PresetPrompt) => {
    const model = preset.modelSettings.systemPrompt?.includes("GPT-5")
      ? "gpt-5"
      : preset.modelSettings.systemPrompt?.includes("o3")
      ? "o3-mini"
      : preset.modelSettings.systemPrompt?.includes("Gemini")
      ? "gemini"
      : "gpt-5";
    
    onSelectModel(model as AIModel, preset.modelSettings);
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setViewMode("choice");
      setSystemPrompt("");
      setTemperature(1);
      setMaxTokens(undefined);
      setTopP(1);
      setReasoningEffort("medium");
      setShowAdvanced(false);
    }, 300);
  };

  const getModelLabel = (settings: ModelSettings): string => {
    const prompt = settings.systemPrompt?.toLowerCase() || "";
    if (prompt.includes("gpt-5") && !prompt.includes("mini")) return "GPT-5";
    if (prompt.includes("gpt-5 mini")) return "GPT-5 Mini";
    if (prompt.includes("o3-mini") || prompt.includes("stem")) return "o3-mini";
    if (prompt.includes("gemini")) return "Gemini";
    return "Custom";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-new-chat">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {viewMode !== "choice" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -ml-2"
                onClick={() => setViewMode("choice")}
                data-testid="button-back-to-choice"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Создать новый чат
          </DialogTitle>
          <DialogDescription>
            {viewMode === "choice" && "Выберите способ создания чата"}
            {viewMode === "presets" && "Выберите готовое решение"}
            {viewMode === "manual" && "Выберите AI модель и настройте параметры"}
          </DialogDescription>
        </DialogHeader>
        
        {viewMode === "choice" && (
          <div className="space-y-3 py-4">
            <button
              onClick={() => setViewMode("presets")}
              className="w-full rounded-md border border-border p-6 text-left hover-elevate active-elevate-2 transition-all"
              data-testid="button-use-presets"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Использовать готовые решения</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Выберите из предустановленных промптов, созданных администратором
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setViewMode("manual")}
              className="w-full rounded-md border border-border p-6 text-left hover-elevate active-elevate-2 transition-all"
              data-testid="button-choose-manually"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-muted p-3">
                  <Settings2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Выбрать самостоятельно</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Настройте модель и параметры вручную
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {viewMode === "presets" && (
          <div className="space-y-4 py-4">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-md border p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* Admin Presets Section */}
                {approvedPresets && approvedPresets.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">
                      От администратора
                    </h3>
                    <div className="space-y-2">
                      {approvedPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset)}
                          className="w-full rounded-md border border-border p-4 text-left hover-elevate active-elevate-2 transition-all"
                          data-testid={`button-preset-${preset.id}`}
                        >
                          <div className="space-y-1">
                            <h3 className="font-semibold">{preset.name}</h3>
                            {preset.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {preset.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                              <span className="font-medium">{getModelLabel(preset.modelSettings)}</span>
                              <span>•</span>
                              <span>
                                {format(new Date(preset.createdAt), "d MMMM yyyy", { locale: ru })}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Presets Section */}
                {userPresets && userPresets.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">
                      Мои промпты
                    </h3>
                    <div className="space-y-2">
                      {userPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset)}
                          className="w-full rounded-md border border-border p-4 text-left hover-elevate active-elevate-2 transition-all"
                          data-testid={`button-user-preset-${preset.id}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{preset.name}</h3>
                              {preset.status === "pending" && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                  На рассмотрении
                                </span>
                              )}
                              {preset.status === "approved" && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                  Одобрено
                                </span>
                              )}
                              {preset.status === "rejected" && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                                  Отклонено
                                </span>
                              )}
                            </div>
                            {preset.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {preset.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                              <span className="font-medium">{getModelLabel(preset.modelSettings)}</span>
                              <span>•</span>
                              <span>
                                {format(new Date(preset.createdAt), "d MMMM yyyy", { locale: ru })}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!approvedPresets || approvedPresets.length === 0) &&
                 (!userPresets || userPresets.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Нет доступных готовых решений</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setViewMode("manual")}
                      data-testid="button-go-to-manual"
                    >
                      Настроить самостоятельно
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {viewMode === "manual" && (
          <>
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
                onClick={handleClose}
                data-testid="button-cancel-new-chat"
              >
                Отмена
              </Button>
              <Button onClick={handleConfirm} data-testid="button-confirm-new-chat">
                Создать чат
              </Button>
            </div>
          </>
        )}

        {viewMode === "choice" && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-choice"
            >
              Отмена
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
