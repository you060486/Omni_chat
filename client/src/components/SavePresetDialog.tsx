import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModelSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelSettings: ModelSettings;
  onSuccess?: () => void;
}

export function SavePresetDialog({
  open,
  onOpenChange,
  modelSettings,
  onSuccess,
}: SavePresetDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название промпта",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/presets/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          modelSettings,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save preset");
      }

      toast({
        title: "Успешно",
        description: "Промпт отправлен на рассмотрение администратору",
      });

      setName("");
      setDescription("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving preset:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить промпт",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-save-preset">
        <DialogHeader>
          <DialogTitle>Сохранить настройки как промпт</DialogTitle>
          <DialogDescription>
            Дайте название вашим настройкам. После модерации администратором они
            станут доступны всем пользователям.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Название</Label>
            <Input
              id="preset-name"
              data-testid="input-preset-name"
              placeholder="Например: Помощник по программированию"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-description">Описание (необязательно)</Label>
            <Textarea
              id="preset-description"
              data-testid="input-preset-description"
              placeholder="Краткое описание для чего предназначен этот промпт"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              data-testid="button-cancel-save-preset"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              data-testid="button-confirm-save-preset"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
