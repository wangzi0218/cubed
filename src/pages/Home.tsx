import { Box } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCubeStore } from "@/stores/cube-store";

export function Home() {
  const { setAppStep } = useCubeStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Box className="w-10 h-10" />
          <h1 className="text-4xl font-bold tracking-tight">Cubed</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          拍摄你的魔方，一步步引导你还原
        </p>
      </div>

      <Card clickable onClick={() => setAppStep("cube-type")}>
        <CardHeader className="items-center text-center">
          <Box className="w-8 h-8 mb-2 text-primary" />
          <CardTitle className="text-lg">还原魔方</CardTitle>
          <CardDescription>拍摄或手动输入魔方状态，获取还原步骤</CardDescription>
        </CardHeader>
      </Card>

      <p className="text-xs text-muted-foreground/50 mt-8">v0.8.0</p>
    </div>
  );
}
