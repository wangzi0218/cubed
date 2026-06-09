import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useCubeStore } from "@/stores/cube-store";

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  detail: string;
  algorithms?: { label: string; notation: string }[];
}

const stages: Stage[] = [
  {
    id: 1,
    title: "底面十字",
    subtitle: "Cross",
    description: "在白色底面拼出十字，关键是找到白色棱块并转到底面。",
    detail:
      "先观察四个白色棱块的位置，通过旋转对应面将其移动到白色底面，形成十字形状。完成后，十字的侧面颜色应与相邻面中心块颜色一致。这一步不需要公式，主要依靠观察和基础转动。",
  },
  {
    id: 2,
    title: "底面角块",
    subtitle: "First Layer Corners",
    description: "将白色角块归位，完成第一层。",
    detail:
      "找到白色角块，将其移动到顶层对应位置，再使用右手公式将其归位。重复四次即可完成整个第一层。核心思路是先定位角块，再用公式调整朝向。",
  },
  {
    id: 3,
    title: "中层棱块",
    subtitle: "Second Layer",
    description: "将中间层的棱块归位，完成第二层。",
    detail:
      "在顶层找到不含黄色的棱块，根据目标位置选择右插或左插公式。如果中层棱块位置正确但朝向错误，先用公式将其弹出到顶层，再重新插入。",
    algorithms: [
      { label: "右插", notation: "U R U' R' U' F' U F" },
      { label: "左插", notation: "U' L' U L U F U' F'" },
    ],
  },
  {
    id: 4,
    title: "顶面还原",
    subtitle: "Last Layer",
    description: "先翻转顶面朝向（OLL），再排列位置（PLL）。",
    detail:
      "先用 OLL 公式将顶面全部翻转为黄色朝上，再用 PLL 公式调整顶层棱块和角块的位置。初学者可以分两步完成：先做顶面十字，再还原顶面角块朝向，最后排列位置。",
    algorithms: [
      { label: "顶面十字 (OLL)", notation: "F R U R' U' F'" },
      { label: "顶面朝向 (OLL)", notation: "R U R' U R U2 R'" },
      { label: "角块归位 (PLL)", notation: "R U R' U' R' F R2 U' R' U' R U R' F'" },
      { label: "棱块归位 (PLL)", notation: "R U' R U R U R U' R' U' R2" },
    ],
  },
];

function StageCard({ stage }: { stage: Stage }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      clickable
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="items-center text-center">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-2">
          {stage.id}
        </div>
        <CardTitle className="text-lg">
          {stage.title}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({stage.subtitle})
          </span>
        </CardTitle>
        <CardDescription>{stage.description}</CardDescription>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span>{expanded ? "收起" : "展开详情"}</span>
        </div>
      </CardHeader>

      {expanded && (
        <div className="px-6 pb-6 space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stage.detail}
          </p>

          {stage.algorithms && stage.algorithms.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">核心公式</p>
              {stage.algorithms.map((alg) => (
                <div
                  key={alg.label}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
                >
                  <span className="text-sm text-muted-foreground shrink-0">
                    {alg.label}:
                  </span>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {alg.notation}
                  </code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function Learn() {
  const { setAppStep } = useCubeStore();

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setAppStep("home")}
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <h2 className="text-xl font-bold tracking-tight">学习还原</h2>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted-foreground text-base">
            层先法（Layer-by-Layer）是最经典的入门还原方法
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stages.map((stage) => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </div>
    </div>
  );
}
