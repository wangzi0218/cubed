import { create } from "zustand";
import type {
  AppStep,
  CubeSize,
  CubeState,
  InputMethod,
  SolutionStep,
  StickerOrientations,
} from "@/types/cube";
import { createSolvedState } from "@/lib/cube-state";
import { createInitialOrientations } from "@/lib/sticker-orientation";

interface CubeStore {
  // Navigation
  appStep: AppStep;
  setAppStep: (step: AppStep) => void;

  // Cube config
  cubeSize: CubeSize;
  setCubeSize: (size: CubeSize) => void;

  // Input method
  inputMethod: InputMethod;
  setInputMethod: (method: InputMethod) => void;

  // Cube state
  currentState: CubeState;
  setCurrentState: (state: CubeState) => void;

  // Sticker images (pattern/photo input) — persisted for 3D preview
  stickerImages?: string[];
  setStickerImages: (images: string[] | undefined) => void;

  // Sticker orientations for pattern cubes
  stickerOrientations: StickerOrientations;
  setStickerOrientations: (orientations: StickerOrientations) => void;

  // Solution
  solution: string | null;
  solutionSteps: SolutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  setSolution: (solution: string, steps: SolutionStep[]) => void;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIsPlaying: (playing: boolean) => void;

  // Reset
  reset: () => void;
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  appStep: "home",
  setAppStep: (step) => set({ appStep: step }),

  cubeSize: 3,
  setCubeSize: (size) =>
    set({
      cubeSize: size,
      currentState: createSolvedState(size),
      stickerOrientations: createInitialOrientations(size),
    }),

  inputMethod: "manual",
  setInputMethod: (method) => set({ inputMethod: method }),

  currentState: createSolvedState(3),
  setCurrentState: (state) => set({ currentState: state }),

  stickerImages: undefined,
  setStickerImages: (images) => set({ stickerImages: images }),

  stickerOrientations: createInitialOrientations(3),
  setStickerOrientations: (orientations) => set({ stickerOrientations: orientations }),

  solution: null,
  solutionSteps: [],
  currentStepIndex: -1,
  isPlaying: false,

  setSolution: (solution, steps) =>
    set({
      solution,
      solutionSteps: steps,
      currentStepIndex: -1,
      isPlaying: false,
    }),

  setCurrentStepIndex: (index) => {
    const { solutionSteps } = get();
    const clamped = Math.max(-1, Math.min(index, solutionSteps.length - 1));
    set({ currentStepIndex: clamped });
  },

  nextStep: () => {
    const { currentStepIndex, solutionSteps } = get();
    if (currentStepIndex < solutionSteps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > -1) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  reset: () =>
    set({
      appStep: "home",
      cubeSize: 3,
      inputMethod: "manual",
      currentState: createSolvedState(3),
      stickerImages: undefined,
      stickerOrientations: createInitialOrientations(3),
      solution: null,
      solutionSteps: [],
      currentStepIndex: -1,
      isPlaying: false,
    }),
}));
