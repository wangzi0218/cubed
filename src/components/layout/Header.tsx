import { Box, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCubeStore } from "@/stores/cube-store";
import { useTheme } from "@/hooks/useTheme";

export function Header() {
  const { reset, appStep } = useCubeStore();
  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            if (appStep === "home" || window.confirm("返回首页将清除当前进度，确定继续？")) {
              reset();
            }
          }}
        >
          <Box className="w-5 h-5" />
          <span className="font-semibold tracking-tight">Cubed</span>
        </button>
        <div className="flex items-center gap-2">
          {appStep !== "home" && (
            <Button variant="ghost" size="sm" onClick={() => {
              if (window.confirm("返回首页将清除当前进度，确定继续？")) {
                reset();
              }
            }}>
              重新开始
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {resolvedTheme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
