import { CubeViewer } from "@/components/cube/CubeViewer";
import { PageHeader } from "./PageHeader";
import type { CubeState, CubeSize, StickerOrientations } from "@/types/cube";

interface CubePreviewLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  state: CubeState;
  size: CubeSize;
  previewHint?: string;
  stickerImages?: string[];
  stickerOrientations?: StickerOrientations;
  onStickerClick?: (stickerIndex: number) => void;
  children: React.ReactNode;
}

export function CubePreviewLayout({
  title,
  subtitle,
  onBack,
  state,
  size,
  previewHint = "拖拽旋转查看 3D 预览",
  stickerImages,
  stickerOrientations,
  onStickerClick,
  children,
}: CubePreviewLayoutProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <PageHeader title={title} subtitle={subtitle} onBack={onBack} />

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Left: 3D preview */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-md aspect-square rounded-xl border bg-card/50 overflow-hidden">
              <CubeViewer state={state} size={size} stickerImages={stickerImages} stickerOrientations={stickerOrientations} onStickerClick={onStickerClick} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{previewHint}</p>
          </div>

          {/* Right: controls */}
          <div className="flex-1 flex flex-col gap-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
