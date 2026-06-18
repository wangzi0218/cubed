import { useState, useCallback } from "react";
import { RefreshCw, Play, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { CubePreviewLayout } from "@/components/layout/CubePreviewLayout";
import { ActionBar } from "@/components/layout/ActionBar";
import { ErrorMessage } from "@/components/ui/error-message";
import { useCubeStore } from "@/stores/cube-store";
import { generateScramble } from "@/lib/scramble";
import { applyMoves, initSolver, parseMoves, solveCube } from "@/lib/solver";
import { createSolvedState } from "@/lib/cube-state";
import { getMoveChinese, MOVE_NOTATION_GUIDE } from "@/lib/move-i18n";

export function Scramble() {
  const { cubeSize, setAppStep, setSolution, setCurrentState, setStickerImages } = useCubeStore();
  const [scramble, setScramble] = useState(() => {
    initSolver();
    return generateScramble(cubeSize);
  });
  const [showGuide, setShowGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);

  const handleRegenerate = useCallback(() => {
    setScramble(generateScramble(cubeSize));
    setError(null);
  }, [cubeSize]);

  const handleStart = useCallback(() => {
    setError(null);
    setSolving(true);
    const solvedState = createSolvedState(cubeSize);
    const moves = parseMoves(scramble);
    const steps = applyMoves(solvedState, moves);
    const scrambledState = steps.length > 0 ? steps[steps.length - 1].stateAfter : solvedState;

    setCurrentState(scrambledState);
    setStickerImages(undefined);
    try {
      const result = solveCube(scrambledState, cubeSize);
      setSolution(result.solution, result.steps);
      setAppStep("solution");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "求解失败，请重试";
      setError(msg);
    } finally {
      setSolving(false);
    }
  }, [cubeSize, scramble, setAppStep, setSolution, setCurrentState, setStickerImages]);

  const handleBack = useCallback(() => {
    setAppStep("cube-type");
  }, [setAppStep]);

  const previewState = (() => {
    const solvedState = createSolvedState(cubeSize);
    const moves = parseMoves(scramble);
    const steps = applyMoves(solvedState, moves);
    return steps.length > 0 ? steps[steps.length - 1].stateAfter : solvedState;
  })();

  return (
    <CubePreviewLayout
      title={`${cubeSize}×${cubeSize} 打乱公式`}
      onBack={handleBack}
      state={previewState}
      size={cubeSize}
    >
      <div>
        <p className="text-sm font-medium mb-3">打乱公式</p>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-mono text-muted-foreground mb-3 break-all">
            {scramble}
          </p>
          <div className="flex flex-wrap gap-2">
            {parseMoves(scramble).map((move, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-2.5 py-1"
              >
                <span className="font-mono font-semibold">{move.notation}</span>
                <span className="text-muted-foreground">{getMoveChinese(move)}</span>
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          按照此公式在已还原的魔方上执行打乱操作
        </p>
      </div>

      {/* Notation guide */}
      <div>
        <button
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={() => setShowGuide(!showGuide)}
        >
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          记号说明
        </button>
        {showGuide && (
          <div className="mt-3 rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-3">
              每个字母代表魔方的一个面，后缀表示旋转方式：
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOVE_NOTATION_GUIDE.map((item) => (
                <div
                  key={item.notation}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="font-mono font-semibold w-6 text-center">
                    {item.notation}
                  </span>
                  <span className="text-muted-foreground">{item.chinese}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
              <p>无后缀 = 顺时针 90°（如 R）</p>
              <p>' 后缀 = 逆时针 90°（如 R'）</p>
              <p>2 后缀 = 旋转 180°（如 R2）</p>
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionBar
        actions={[
          { label: "重新生成", icon: RefreshCw, onClick: handleRegenerate, variant: "outline", disabled: solving },
          { label: solving ? "求解中..." : "开始求解", icon: solving ? Loader2 : Play, onClick: handleStart, disabled: solving },
        ]}
      />
    </CubePreviewLayout>
  );
}
