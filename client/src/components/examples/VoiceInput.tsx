import { useState } from "react";
import { VoiceInput } from "../VoiceInput";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function VoiceInputExample() {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState("");

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Button onClick={() => setOpen(true)}>
        <Mic className="mr-2 h-4 w-4" />
        Открыть голосовой ввод
      </Button>
      {transcript && (
        <div className="rounded border bg-card p-3 text-sm">
          <strong>Распознано:</strong> {transcript}
        </div>
      )}
      <VoiceInput
        open={open}
        onOpenChange={setOpen}
        onTranscript={(text) => {
          setTranscript(text);
          console.log("Transcript received:", text);
        }}
      />
    </div>
  );
}
