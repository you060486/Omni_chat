import Chat from "../Chat";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function ChatExample() {
  const style = {
    "--sidebar-width": "20rem",
  };

  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="h-screen w-full">
          <Chat selectedModel="gpt-5" />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
