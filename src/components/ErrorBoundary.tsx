import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  private handleReload = () => {
    location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">页面遇到了问题</CardTitle>
              <CardDescription>
                可能是魔方渲染或求解过程中出现了错误
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Button onClick={this.handleReload} className="w-full">
                重新开始
              </Button>
              {this.state.error && (
                <details className="w-full text-sm">
                  <summary className="cursor-pointer text-muted-foreground select-none">
                    错误详情
                  </summary>
                  <pre className="mt-2 p-3 rounded-md bg-muted text-muted-foreground text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
