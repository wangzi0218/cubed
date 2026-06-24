import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCubeStore } from "@/stores/cube-store";
import { FACE_COLORS } from "@/types/cube";
import type { CubeSize } from "@/types/cube";

const { R, F, D, B, U, L } = FACE_COLORS;

const cubeTypes = [
  {
    size: 2 as CubeSize,
    title: "2 × 2",
    description: "口袋魔方，入门级",
    grid: (
      <div className="grid grid-cols-2 gap-1 w-16 h-16">
        {[R, F, D, B].map((c, i) => (
          <div key={i} className="rounded-sm" style={{ backgroundColor: c.hex }} />
        ))}
      </div>
    ),
  },
  {
    size: 3 as CubeSize,
    title: "3 × 3",
    description: "经典三阶魔方",
    grid: (
      <div className="grid grid-cols-3 gap-0.5 w-16 h-16">
        {[R, F, D, B, U, L, R, D, F].map((c, i) => (
          <div key={i} className="rounded-sm" style={{ backgroundColor: c.hex }} />
        ))}
      </div>
    ),
  },
];

export function CubeTypeSelect() {
  const { setAppStep, setCubeSize } = useCubeStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => setAppStep("home")}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            选择魔方类型
          </h2>
          <p className="text-muted-foreground">
            你使用的是哪种魔方？
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cubeTypes.map((ct) => (
            <Card
              key={ct.size}
              clickable
              onClick={() => {
                setCubeSize(ct.size);
                setAppStep("input-method");
              }}
            >
              <CardHeader className="items-center text-center">
                <div className="mb-3">{ct.grid}</div>
                <CardTitle>{ct.title}</CardTitle>
                <CardDescription>{ct.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
