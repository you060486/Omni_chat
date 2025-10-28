import { useState } from "react";
import { ImageGenerator } from "../ImageGenerator";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function ImageGeneratorExample() {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Button onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        Открыть генератор изображений
      </Button>
      {imageUrl && (
        <div className="w-64">
          <img src={imageUrl} alt="Generated" className="rounded-lg" />
        </div>
      )}
      <ImageGenerator
        open={open}
        onOpenChange={setOpen}
        onImageGenerated={(url) => {
          setImageUrl(url);
          console.log("Image generated:", url);
        }}
      />
    </div>
  );
}
