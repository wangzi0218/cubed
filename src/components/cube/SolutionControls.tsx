import { useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SolutionStep, Move } from "@/types/cube";

interface SolutionControlsProps {
  steps: SolutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  onStepChange: (index: number) => void;
  onPlayToggle: () => void;
  onReset: () => void;
  onMoveStart?: (move: Move) => void;
  onMoveEnd?: () => void;
}

export function SolutionControls({
  steps,
  currentStepIndex,
  isPlaying,
  onStepChange,
  onPlayToggle,
  onReset,
  onMoveStart,
  onMoveEnd,
}: SolutionControlsProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ANIMATION_DURATION = 600;

  const playNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const move = steps[nextIndex].move;
      onMoveStart?.(move);
      onStepChange(nextIndex);

      timerRef.current = setTimeout(() => {
        onMoveEnd?.();
      }, ANIMATION_DURATION);
    } else {
      onPlayToggle();
    }
  }, [currentStepIndex, steps, onStepChange, onPlayToggle, onMoveStart, onMoveEnd]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const interval = setInterval(playNextStep, ANIMATION_DURATION + 200);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, playNextStep]);

  const isFirst = currentStepIndex <= -1;
  const isLast = currentStepIndex >= steps.length - 1;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        title="回到初始状态"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onStepChange(currentStepIndex - 1)}
        disabled={isFirst}
        title="上一步"
      >
        <SkipBack className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        onClick={onPlayToggle}
        disabled={isLast && !isPlaying}
        title={isPlaying ? "暂停" : "播放"}
        className="w-12 h-12 rounded-full"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onStepChange(currentStepIndex + 1)}
        disabled={isLast}
        title="下一步"
      >
        <SkipForward className="w-4 h-4" />
      </Button>
    </div>
  );
}
