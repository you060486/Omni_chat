import { ChatInput } from "../ChatInput";

export default function ChatInputExample() {
  return (
    <div className="h-96 flex flex-col">
      <div className="flex-1" />
      <ChatInput
        onSendMessage={(text, files, images) => {
          console.log("Message:", text);
          console.log("Files:", files);
          console.log("Images:", images);
        }}
        onVoiceClick={() => console.log("Voice clicked")}
        onImageGenClick={() => console.log("Image gen clicked")}
      />
    </div>
  );
}
