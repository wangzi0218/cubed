import { cn } from "@/lib/utils";
import type { SolutionStep } from "@/types/cube";
import { Check } from "lucide-react";

interface StepListProps {
  steps: SolutionStep[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
}

export function StepList({ steps, currentStepIndex, onStepClick }: StepListProps) {
  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-1">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 min-h-[44px] rounded-lg cursor-pointer transition-colors",
          currentStepIndex === -1
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        )}
        onClick={() => onStepClick(-1)}
      >
        <span className="text-sm font-mono w-6 text-center">0</span>
        <span className="text-sm">初始状态</span>
      </div>

      {steps.map((step) => {
        const isActive = step.index === currentStepIndex;
        const isDone = step.index < currentStepIndex;

        return (
          <div
            key={step.index}
            className={cn(
              "flex items-center gap-3 px-3 py-2 min-h-[44px] rounded-lg cursor-pointer transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : isDone
                ? "text-muted-foreground hover:bg-muted"
                : "text-foreground hover:bg-muted"
            )}
            onClick={() => onStepClick(step.index)}
          >
            <span className="text-sm font-mono w-6 text-center">
              {step.index + 1}
            </span>
            <span className="text-sm font-mono font-semibold tracking-wider">
              {step.move.notation}
            </span>
            {isDone && <Check className="w-4 h-4 ml-auto opacity-60" />}
          </div>
        );
      })}
    </div>
  );
}
