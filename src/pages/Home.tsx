import { Box, Shuffle, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCubeStore } from "@/stores/cube-store";

const options = [
  {
    id: "solve",
    icon: Box,
    title: "还原魔方",
    description: "拍摄或手动输入魔方状态，获取还原步骤",
  },
  {
    id: "scramble",
    icon: Shuffle,
    title: "打乱魔方",
    description: "生成标准打乱公式",
  },
  {
    id: "learn",
    icon: BookOpen,
    title: "学习还原",
    description: "分步教学，从零开始学魔方",
  },
];

export function Home() {
  const { setAppStep, setFlowOrigin } = useCubeStore();

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {options.map((opt) => (
          <Card
            key={opt.id}
            clickable
            onClick={() => {
              if (opt.id === "solve") {
                setFlowOrigin("solve");
                setAppStep("cube-type");
              } else if (opt.id === "scramble") {
                setFlowOrigin("scramble");
                setAppStep("cube-type");
              } else if (opt.id === "learn") {
                setFlowOrigin("learn");
                setAppStep("learn");
              }
            }}
          >
            <CardHeader className="items-center text-center">
              <opt.icon className="w-8 h-8 mb-2 text-primary" />
              <CardTitle className="text-lg">{opt.title}</CardTitle>
              <CardDescription>{opt.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/50 mt-8">v0.4.2</p>
    </div>
  );
}
