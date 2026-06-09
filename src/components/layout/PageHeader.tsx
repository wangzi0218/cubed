import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({ title, subtitle, onBack, className }: PageHeaderProps) {
  return (
    <div className={`flex items-center gap-4 mb-6 ${className ?? ""}`}>
      {onBack && (
        <Button variant="ghost" className="gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      )}
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {subtitle}
    </div>
  );
}
