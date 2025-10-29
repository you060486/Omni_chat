import { Sparkles, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ImageGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (url: string) => void;
}

export function ImageGenerator({ open, onOpenChange, onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Ошибка генерации",
        description: "Не удалось создать изображение. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Изображение сохранено",
        description: "Изображение успешно загружено в высоком качестве",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить изображение",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setPrompt("");
    setGeneratedImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="dialog-image-generator">
        <DialogHeader>
          <DialogTitle>Генерация изображения</DialogTitle>
          <DialogDescription>
            Опишите изображение, которое хотите создать с помощью Nano Banana (Gemini 2.5 Flash Image)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Например: Футуристический город на закате с летающими автомобилями..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-32 resize-none"
            disabled={isGenerating}
            data-testid="input-image-prompt"
          />

          {generatedImage ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border max-h-[60vh] flex items-center justify-center bg-muted">
                <img
                  src={generatedImage}
                  alt="Сгенерированное изображение"
                  className="w-full h-full object-contain"
                  data-testid="generated-image"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                  data-testid="button-regenerate"
                >
                  Создать новое
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDownload}
                  data-testid="button-download-image"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Сохранить в высоком качестве
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              data-testid="button-generate-image"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Создать изображение
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
