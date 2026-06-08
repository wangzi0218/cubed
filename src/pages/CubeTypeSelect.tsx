import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCubeStore } from "@/stores/cube-store";
import type { CubeSize } from "@/types/cube";

const cubeTypes = [
  {
    size: 2 as CubeSize,
    title: "2 × 2",
    description: "口袋魔方，入门级",
    grid: (
      <div className="grid grid-cols-2 gap-1 w-16 h-16">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              backgroundColor:
                i === 0 ? "#b71234" : i === 1 ? "#0046ad" : i === 2 ? "#ffd500" : "#009b48",
            }}
          />
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
        {["#b71234", "#0046ad", "#ffd500", "#009b48", "#ffffff", "#ff5800", "#b71234", "#ffd500", "#0046ad"].map(
          (color, i) => (
            <div key={i} className="rounded-sm" style={{ backgroundColor: color }} />
          )
        )}
      </div>
    ),
  },
];

export function CubeTypeSelect() {
  const { setAppStep, setCubeSize, flowOrigin } = useCubeStore();

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
              className="cursor-pointer hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all"
              onClick={() => {
                setCubeSize(ct.size);
                setAppStep(flowOrigin === "scramble" ? "scramble" : "input-method");
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
