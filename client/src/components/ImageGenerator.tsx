import { Sparkles, Loader2 } from "lucide-react";
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

interface ImageGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (url: string) => void;
}

export function ImageGenerator({ open, onOpenChange, onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // todo: remove mock functionality
    setTimeout(() => {
      const mockImageUrl = `https://placehold.co/512x512/2563eb/ffffff?text=${encodeURIComponent(prompt.slice(0, 20))}`;
      setGeneratedImage(mockImageUrl);
      setIsGenerating(false);
    }, 2000);
  };

  const handleUse = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      onOpenChange(false);
      setPrompt("");
      setGeneratedImage(null);
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
            Опишите изображение, которое хотите создать с помощью Gemini Imagen 3
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
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={generatedImage}
                  alt="Сгенерированное изображение"
                  className="w-full"
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
                  onClick={handleUse}
                  data-testid="button-use-image"
                >
                  Использовать изображение
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
