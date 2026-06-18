import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette, Grid3x3, Camera, Image } from "lucide-react";
import { useCubeStore } from "@/stores/cube-store";
import type { InputMethod } from "@/types/cube";

const methods = [
  {
    id: "manual" as InputMethod,
    icon: Grid3x3,
    title: "手动输入",
    description: "在展开图上逐个选择颜色，最可靠的方式",
  },
  {
    id: "color" as InputMethod,
    icon: Camera,
    title: "拍照识别",
    description: "拍摄 6 个面，自动识别颜色",
  },
  {
    id: "pattern" as InputMethod,
    icon: Image,
    title: "图案识别",
    description: "拍摄 6 面，拖拽分配到面位置，适用于图片/纹理魔方",
  },
  {
    id: "topology" as InputMethod,
    icon: Palette,
    title: "魔方识别",
    description: "", // filled dynamically based on cubeSize
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
          {methods.map((m) => {
            const desc = m.id === "topology"
              ? (cubeSize === 2
                ? "拍摄角块，通过空间关系自动识别状态，适用于任意魔方"
                : "拍摄边块和角块，通过空间关系自动识别状态，适用于任意魔方")
              : m.description;
            return (
            <Card
              key={m.id}
              clickable
              onClick={() => {
                setInputMethod(m.id);
                setAppStep("input");
              }}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <m.icon className="w-8 h-8 text-primary shrink-0" />
                <div className="text-left">
                  <CardTitle className="text-base">{m.title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ); })}
        </div>
      </div>
    </div>
  );
}
