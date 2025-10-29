import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PresetPrompt, InsertPresetPrompt } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Pencil, Trash2, Sparkles, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AIModel, ModelSettings, ReasoningEffort } from "@shared/schema";

type DialogMode = "create" | "edit" | null;

export default function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"admin" | "pending">("admin");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingPreset, setEditingPreset] = useState<PresetPrompt | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt-5");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(1);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
  const [topP, setTopP] = useState(1);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("medium");

  const { data: presets, isLoading } = useQuery<PresetPrompt[]>({
    queryKey: ["/api/presets"],
  });

  const { data: pendingPresets, isLoading: isLoadingPending } = useQuery<PresetPrompt[]>({
    queryKey: ["/api/presets/pending"],
    refetchOnMount: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPresetPrompt) => {
      return apiRequest("POST", "/api/presets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({
        title: "Успешно",
        description: "Готовое решение создано",
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать готовое решение",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPresetPrompt> }) => {
      return apiRequest("PUT", `/api/presets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({
        title: "Успешно",
        description: "Готовое решение обновлено",
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить готовое решение",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({
        title: "Успешно",
        description: "Готовое решение удалено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить готовое решение",
        variant: "destructive",
      });
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      return apiRequest("PATCH", `/api/presets/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/presets/approved"] });
      toast({
        title: "Успешно",
        description: variables.status === "approved" ? "Промпт одобрен" : "Промпт отклонен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить статус",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    resetForm();
    setDialogMode("create");
  };

  const openEditDialog = (preset: PresetPrompt) => {
    setEditingPreset(preset);
    setName(preset.name);
    setDescription(preset.description || "");
    
    const settings = preset.modelSettings;
    setSystemPrompt(settings.systemPrompt || "");
    setTemperature(settings.temperature ?? 1);
    setMaxTokens(settings.maxTokens);
    setTopP(settings.topP ?? 1);
    setReasoningEffort(settings.reasoningEffort ?? "medium");
    
    const modelFromPrompt = settings.systemPrompt?.toLowerCase() || "";
    if (modelFromPrompt.includes("o3-mini") || modelFromPrompt.includes("stem")) {
      setSelectedModel("o3-mini");
    } else if (modelFromPrompt.includes("gemini")) {
      setSelectedModel("gemini");
    } else if (modelFromPrompt.includes("gpt-5 mini")) {
      setSelectedModel("gpt-5-mini");
    } else {
      setSelectedModel("gpt-5");
    }
    
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingPreset(null);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedModel("gpt-5");
    setSystemPrompt("");
    setTemperature(1);
    setMaxTokens(undefined);
    setTopP(1);
    setReasoningEffort("medium");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название",
        variant: "destructive",
      });
      return;
    }

    const modelSettings: ModelSettings = {};
    if (systemPrompt) modelSettings.systemPrompt = systemPrompt;
    if (temperature !== 1) modelSettings.temperature = temperature;
    if (maxTokens) modelSettings.maxTokens = maxTokens;
    if (topP !== 1) modelSettings.topP = topP;
    if (selectedModel === "o3-mini") modelSettings.reasoningEffort = reasoningEffort;

    const data: InsertPresetPrompt = {
      name: name.trim(),
      description: description.trim() || undefined,
      modelSettings,
    };

    if (dialogMode === "create") {
      createMutation.mutate(data);
    } else if (dialogMode === "edit" && editingPreset) {
      updateMutation.mutate({ id: editingPreset.id, data });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить это готовое решение?")) {
      deleteMutation.mutate(id);
    }
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
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <p className="text-muted-foreground mt-1">
            Управление готовыми решениями для пользователей
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-preset">
          <Plus className="h-4 w-4 mr-2" />
          Создать решение
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "admin" | "pending")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="admin" data-testid="tab-admin-presets">
            Админские промпты
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-presets">
            На рассмотрении ({pendingPresets?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4 mt-6">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </>
          ) : presets && presets.length > 0 ? (
            presets.filter(p => p.status === "admin").map((preset) => (
              <Card key={preset.id} className="hover-elevate" data-testid={`card-preset-${preset.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle>{preset.name}</CardTitle>
                      </div>
                      {preset.description && (
                        <CardDescription className="mt-2">{preset.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-3">
                        <span className="font-medium">{getModelLabel(preset.modelSettings)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(preset.createdAt), "d MMMM yyyy", { locale: ru })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(preset)}
                        data-testid={`button-edit-${preset.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(preset.id)}
                        data-testid={`button-delete-${preset.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {preset.modelSettings.systemPrompt && (
                  <CardContent>
                    <div className="text-sm">
                      <p className="font-medium mb-1">Системный промпт:</p>
                      <p className="text-muted-foreground line-clamp-3">
                        {preset.modelSettings.systemPrompt}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Нет готовых решений</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                Создать первое решение
              </Button>
            </CardContent>
          </Card>
        )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {isLoadingPending ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </>
          ) : pendingPresets && pendingPresets.length > 0 ? (
            pendingPresets.map((preset) => (
              <Card key={preset.id} className="hover-elevate" data-testid={`card-pending-preset-${preset.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{preset.name}</CardTitle>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                          Ожидает модерации
                        </span>
                      </div>
                      {preset.description && (
                        <CardDescription className="mt-2">{preset.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-3">
                        <span className="font-medium">{getModelLabel(preset.modelSettings)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(preset.createdAt), "d MMMM yyyy", { locale: ru })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moderateMutation.mutate({ id: preset.id, status: "approved" })}
                        disabled={moderateMutation.isPending}
                        data-testid={`button-approve-${preset.id}`}
                        className="text-green-600"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moderateMutation.mutate({ id: preset.id, status: "rejected" })}
                        disabled={moderateMutation.isPending}
                        data-testid={`button-reject-${preset.id}`}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {preset.modelSettings.systemPrompt && (
                  <CardContent>
                    <div className="text-sm">
                      <p className="font-medium mb-1">Системный промпт:</p>
                      <p className="text-muted-foreground line-clamp-3">
                        {preset.modelSettings.systemPrompt}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Нет промптов на рассмотрении</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogMode !== null} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Создать готовое решение" : "Редактировать решение"}
            </DialogTitle>
            <DialogDescription>
              Настройте параметры готового решения для пользователей
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Помощник программиста"
                data-testid="input-preset-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание готового решения..."
                className="resize-none"
                rows={2}
                data-testid="input-preset-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Рекомендуемая модель</Label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
                <SelectTrigger data-testid="select-preset-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                  <SelectItem value="o3-mini">o3-mini (STEM)</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-prompt">Системный промпт</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Вы - полезный AI ассистент..."
                className="min-h-24 resize-none"
                data-testid="input-preset-system-prompt"
              />
            </div>

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
                data-testid="slider-preset-temperature"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Максимум токенов</Label>
              <Input
                id="max-tokens"
                type="number"
                value={maxTokens || ""}
                onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Не ограничено"
                min="1"
                max="32000"
                data-testid="input-preset-max-tokens"
              />
            </div>

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
                data-testid="slider-preset-top-p"
              />
            </div>

            {selectedModel === "o3-mini" && (
              <div className="space-y-2">
                <Label>Усилие рассуждения</Label>
                <Select
                  value={reasoningEffort}
                  onValueChange={(v) => setReasoningEffort(v as ReasoningEffort)}
                >
                  <SelectTrigger data-testid="select-preset-reasoning-effort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Быстро</SelectItem>
                    <SelectItem value="medium">Medium - Сбалансировано</SelectItem>
                    <SelectItem value="high">High - Глубокий анализ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-preset">
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-preset"
            >
              {createMutation.isPending || updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
