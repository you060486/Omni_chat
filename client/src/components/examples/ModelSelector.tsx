import { useState } from "react";
import { ModelSelector } from "../ModelSelector";
import { AIModel } from "@shared/schema";

export default function ModelSelectorExample() {
  const [model, setModel] = useState<AIModel>("gpt-5");
  
  return (
    <ModelSelector 
      selectedModel={model} 
      onModelChange={setModel}
    />
  );
}
