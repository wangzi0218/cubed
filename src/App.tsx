import { Header } from "@/components/layout/Header";
import { Home } from "@/pages/Home";
import { CubeTypeSelect } from "@/pages/CubeTypeSelect";
import { InputMethodSelect } from "@/pages/InputMethodSelect";
import { ManualInput } from "@/pages/ManualInput";
import { PhotoInput } from "@/pages/PhotoInput";
import { TopologyInput } from "@/pages/TopologyInput";
import { PatternInput } from "@/pages/PatternInput";
import { Solution } from "@/pages/Solution";
import { useCubeStore } from "@/stores/cube-store";

function App() {
  const appStep = useCubeStore((s) => s.appStep);
  const inputMethod = useCubeStore((s) => s.inputMethod);

  function renderStep() {
    switch (appStep) {
      case "home":
        return <Home />;
      case "cube-type":
        return <CubeTypeSelect />;
      case "input-method":
        return <InputMethodSelect />;
      case "input": {
        if (inputMethod === "color") return <PhotoInput />;
        if (inputMethod === "pattern") return <PatternInput />;
        if (inputMethod === "topology") return <TopologyInput />;
        return <ManualInput />;
      }
      case "solution":
        return <Solution />;
      default:
        return <Home />;
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">{renderStep()}</main>
    </div>
  );
}

export default App;
