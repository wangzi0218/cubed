import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette, Grid3x3, Camera } from "lucide-react";
import { useCubeStore } from "@/stores/cube-store";
import type { InputMethod } from "@/types/cube";

const methods = [
  {
    id: "manual" as InputMethod,
    icon: Grid3x3,
    title: "手动输入",
    description: "在展开图上逐个选择颜色，最可靠的方式",
    available: true,
  },
  {
    id: "color" as InputMethod,
    icon: Camera,
    title: "拍照识别",
    description: "拍摄 6 个面，自动识别颜色",
    available: true,
  },
  {
    id: "topology" as InputMethod,
    icon: Palette,
    title: "拓扑拼合",
    description: "拍摄棱角交界，通过空间关系推断状态，适用于任意魔方",
    available: true,
  },
];

export function InputMethodSelect() {
  const { setAppStep, setInputMethod, cubeSize } = useCubeStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => setAppStep("cube-type")}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            选择输入方式
          </h2>
          <p className="text-muted-foreground">
            {cubeSize}×{cubeSize} 魔方 · 选择一种方式输入当前状态
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {methods.map((m) => (
            <Card
              key={m.id}
              className={`transition-all ${
                m.available
                  ? "cursor-pointer hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => {
                if (m.available) {
                  setInputMethod(m.id);
                  setAppStep("input");
                }
              }}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <m.icon className="w-8 h-8 text-primary shrink-0" />
                <div className="text-left">
                  <CardTitle className="text-base">{m.title}</CardTitle>
                  <CardDescription>{m.description}</CardDescription>
                </div>
                {!m.available && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    即将推出
                  </span>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
