import { Header } from "@/components/layout/Header";
import { Home } from "@/pages/Home";
import { CubeTypeSelect } from "@/pages/CubeTypeSelect";
import { InputMethodSelect } from "@/pages/InputMethodSelect";
import { ManualInput } from "@/pages/ManualInput";
import { PhotoInput } from "@/pages/PhotoInput";
import { TopologyInput } from "@/pages/TopologyInput";
import { PatternInput } from "@/pages/PatternInput";
import { Scramble } from "@/pages/Scramble";
import { Solution } from "@/pages/Solution";
import { Learn } from "@/pages/Learn";
import { useCubeStore } from "@/stores/cube-store";

function App() {
  const appStep = useCubeStore((s) => s.appStep);

  function renderStep() {
    switch (appStep) {
      case "home":
        return <Home />;
      case "cube-type":
        return <CubeTypeSelect />;
      case "input-method":
        return <InputMethodSelect />;
      case "input": {
        const method = useCubeStore.getState().inputMethod;
        if (method === "color") return <PhotoInput />;
        if (method === "pattern") return <PatternInput />;
        if (method === "topology") return <TopologyInput />;
        return <ManualInput />;
      }
      case "scramble":
        return <Scramble />;
      case "solution":
        return <Solution />;
      case "learn":
        return <Learn />;
      default:
        return <Home />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">{renderStep()}</main>
    </div>
  );
}

export default App;
