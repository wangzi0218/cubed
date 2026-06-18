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
import { MOVE_NOTATION_GUIDE } from "@/lib/move-i18n";

interface Stage {
  id: number;
  title: string;
  description: string;
  detail: string;
  algorithms?: { label: string; notation: string }[];
}

const stages: Stage[] = [
  {
    id: 1,
    title: "底面十字",
    description: "在白色底面拼出十字。",
    detail:
      "先观察四个白色边块（两个面之间的块）的位置，通过旋转对应面将其移动到白色底面，形成十字形状。完成后，十字的侧面颜色应与相邻面中心块颜色一致。这一步不需要公式，主要依靠观察和基础转动。",
  },
  {
    id: 2,
    title: "底面角块",
    description: "将白色角块归位，完成第一层。",
    detail:
      "找到白色角块（三个面交汇处的块），将其移动到顶层对应位置，再使用公式将其归位。重复四次即可完成整个第一层。如果角块在底层但朝向不对，先用公式将其弹出到顶层，再重新插入。",
    algorithms: [
      { label: "右侧插入", notation: "R U R'" },
      { label: "左侧插入", notation: "L' U' L" },
      { label: "弹出角块", notation: "R U' R'" },
    ],
  },
  {
    id: 3,
    title: "中层边块",
    description: "将中间层的边块归位，完成第二层。",
    detail:
      "在顶层找到不含黄色的边块，根据目标位置选择右侧插入或左侧插入公式。如果中层边块位置正确但朝向错误，先用公式将其弹出到顶层，再重新插入。",
    algorithms: [
      { label: "右侧插入", notation: "U R U' R' U' F' U F" },
      { label: "左侧插入", notation: "U' L' U L U F U' F'" },
    ],
  },
  {
    id: 4,
    title: "顶面还原",
    description: "先让顶面全部朝上，再调整位置。",
    detail:
      "这一步分两个阶段：第一阶段让顶面黄色全部朝上（专业术语叫 OLL，即调整朝向），第二阶段调整顶层各块的位置使其归位（专业术语叫 PLL，即调整位置）。初学者可以分三步完成：先做顶面十字，再还原顶面全部朝上，最后排列位置。",
    algorithms: [
      { label: "顶面十字", notation: "F R U R' U' F'" },
      { label: "顶面全部朝上", notation: "R U R' U R U2 R'" },
      { label: "角块归位", notation: "R U R' U' R' F R2 U' R' U' R U R' F'" },
      { label: "边块归位", notation: "R U' R U R U R U' R' U' R2" },
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
          {stage.title}
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

        <div className="text-center mb-6">
          <p className="text-muted-foreground text-base">
            层先法是最经典的入门还原方法：先还原底层，再还原中层，最后还原顶层。
          </p>
        </div>

        {/* Notation guide */}
        <Card className="mb-6">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-base">记号说明</CardTitle>
            <CardDescription>
              公式中的字母代表魔方的面，后缀表示旋转方式
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {MOVE_NOTATION_GUIDE.map((item) => (
                <div key={item.notation} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-semibold w-6 text-center">{item.notation}</span>
                  <span className="text-muted-foreground">{item.chinese}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
              <p>无后缀 = 顺时针 90°（如 R 表示右面顺时针转 90°）</p>
              <p>' 后缀 = 逆时针 90°（如 R' 表示右面逆时针转 90°）</p>
              <p>2 后缀 = 旋转 180°（如 R2 表示右面转 180°）</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stages.map((stage) => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </div>
    </div>
  );
}
