import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface ActionButton {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  flex?: boolean;
  disabled?: boolean;
}

interface ActionBarProps {
  actions: ActionButton[];
  className?: string;
}

export function ActionBar({ actions, className }: ActionBarProps) {
  return (
    <div className={`flex gap-3 mt-auto ${className ?? ""}`}>
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <Button
            key={i}
            variant={action.variant ?? "default"}
            className={`${action.flex ? "flex-1" : ""} gap-2`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
