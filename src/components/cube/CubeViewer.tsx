import { useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CubeSize, CubeState, FaceColor, Move } from "@/types/cube";
import { FACE_COLORS } from "@/types/cube";

const CUBIE_SIZE = 0.9;
const INNER_COLOR = "#1a1a2e";

function getColor(face: FaceColor): string {
  return FACE_COLORS[face].hex;
}

function getCubieStickerIndex(
  axis: "x" | "y" | "z",
  sign: number,
  size: CubeSize,
  x: number,
  y: number,
  z: number
): number {
  const s = size;
  const half = (s - 1) / 2;

  if (axis === "x" && sign === 1) {
    const faceOffset = 1 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(z + half);
    return faceOffset + row * s + col;
  }
  if (axis === "x" && sign === -1) {
    const faceOffset = 4 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(half - z);
    return faceOffset + row * s + col;
  }
  if (axis === "y" && sign === 1) {
    const faceOffset = 0;
    const row = Math.round(half - z);
    const col = Math.round(x + half);
    return faceOffset + row * s + col;
  }
  if (axis === "y" && sign === -1) {
    const faceOffset = 3 * s * s;
    const row = Math.round(z + half);
    const col = Math.round(x + half);
    return faceOffset + row * s + col;
  }
  if (axis === "z" && sign === 1) {
    const faceOffset = 2 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(x + half);
    return faceOffset + row * s + col;
  }
  if (axis === "z" && sign === -1) {
    const faceOffset = 5 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(s - 1 - (x + half));
    return faceOffset + row * s + col;
  }
  return -1;
}

function useStickerTexture(imageUrl: string | null): THREE.CanvasTexture | null {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      if (textureRef.current) {
        textureRef.current.dispose();
      }
      textureRef.current = new THREE.CanvasTexture(canvas);
      textureRef.current.needsUpdate = true;
    };
    img.src = imageUrl;

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [imageUrl]);

  return textureRef.current;
}

function getCubieFaceColor(
  axis: "x" | "y" | "z",
  sign: number,
  state: CubeState,
  size: CubeSize,
  x: number,
  y: number,
  z: number
): string {
  const s = size;
  const half = (s - 1) / 2;

  if (axis === "x" && sign === 1) {
    const faceOffset = 1 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(z + half);
    return getColor(state[faceOffset + row * s + col]);
  }
  if (axis === "x" && sign === -1) {
    const faceOffset = 4 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(half - z);
    return getColor(state[faceOffset + row * s + col]);
  }
  if (axis === "y" && sign === 1) {
    const faceOffset = 0;
    const row = Math.round(half - z);
    const col = Math.round(x + half);
    return getColor(state[faceOffset + row * s + col]);
  }
  if (axis === "y" && sign === -1) {
    const faceOffset = 3 * s * s;
    const row = Math.round(z + half);
    const col = Math.round(x + half);
    return getColor(state[faceOffset + row * s + col]);
  }
  if (axis === "z" && sign === 1) {
    const faceOffset = 2 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(x + half);
    return getColor(state[faceOffset + row * s + col]);
  }
  if (axis === "z" && sign === -1) {
    const faceOffset = 5 * s * s;
    const row = Math.round(half - y);
    const col = Math.round(s - 1 - (x + half));
    return getColor(state[faceOffset + row * s + col]);
  }
  return INNER_COLOR;
}

interface CubieProps {
  position: [number, number, number];
  state: CubeState;
  size: CubeSize;
  stickerImages?: string[];
  highlight?: boolean;
}

function StickerFace({
  position,
  rotation,
  stickerUrl,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  stickerUrl: string;
}) {
  const texture = useStickerTexture(stickerUrl);
  if (!texture) return null;

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[CUBIE_SIZE * 0.92, CUBIE_SIZE * 0.92]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.3}
        metalness={0.1}
        transparent
      />
    </mesh>
  );
}

function Cubie({ position, state, size, stickerImages, highlight }: CubieProps) {
  const [x, y, z] = position;

  const materials = useMemo(() => {
    const faces: { axis: "x" | "y" | "z"; sign: number }[] = [
      { axis: "x", sign: 1 },
      { axis: "x", sign: -1 },
      { axis: "y", sign: 1 },
      { axis: "y", sign: -1 },
      { axis: "z", sign: 1 },
      { axis: "z", sign: -1 },
    ];

    return faces.map(({ axis, sign }) => {
      const isExternal =
        (axis === "x" && ((sign === 1 && x > 0.5) || (sign === -1 && x < -0.5))) ||
        (axis === "y" && ((sign === 1 && y > 0.5) || (sign === -1 && y < -0.5))) ||
        (axis === "z" && ((sign === 1 && z > 0.5) || (sign === -1 && z < -0.5)));

      if (!isExternal) {
        return new THREE.MeshStandardMaterial({
          color: INNER_COLOR,
          roughness: 0.8,
        });
      }

      const color = getCubieFaceColor(axis, sign, state, size, x, y, z);
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.1,
      });
    });
  }, [state, size, x, y, z]);

  // Collect external faces that need sticker textures
  const stickerFaces = useMemo(() => {
    if (!stickerImages) return [];
    const faces: { axis: "x" | "y" | "z"; sign: number; pos: [number, number, number]; rot: [number, number, number] }[] = [
      { axis: "x", sign: 1, pos: [CUBIE_SIZE / 2 + 0.001, 0, 0], rot: [0, Math.PI / 2, 0] },
      { axis: "x", sign: -1, pos: [-CUBIE_SIZE / 2 - 0.001, 0, 0], rot: [0, -Math.PI / 2, 0] },
      { axis: "y", sign: 1, pos: [0, CUBIE_SIZE / 2 + 0.001, 0], rot: [-Math.PI / 2, 0, 0] },
      { axis: "y", sign: -1, pos: [0, -CUBIE_SIZE / 2 - 0.001, 0], rot: [Math.PI / 2, 0, 0] },
      { axis: "z", sign: 1, pos: [0, 0, CUBIE_SIZE / 2 + 0.001], rot: [0, 0, 0] },
      { axis: "z", sign: -1, pos: [0, 0, -CUBIE_SIZE / 2 - 0.001], rot: [0, Math.PI, 0] },
    ];

    return faces
      .filter(({ axis, sign }) => {
        const isExternal =
          (axis === "x" && ((sign === 1 && x > 0.5) || (sign === -1 && x < -0.5))) ||
          (axis === "y" && ((sign === 1 && y > 0.5) || (sign === -1 && y < -0.5))) ||
          (axis === "z" && ((sign === 1 && z > 0.5) || (sign === -1 && z < -0.5)));
        if (!isExternal) return false;
        const idx = getCubieStickerIndex(axis, sign, size, x, y, z);
        return idx >= 0 && idx < stickerImages.length;
      })
      .map(({ axis, sign, pos, rot }) => {
        const idx = getCubieStickerIndex(axis, sign, size, x, y, z);
        return { pos, rot, url: stickerImages[idx] };
      });
  }, [stickerImages, size, x, y, z]);

  return (
    <group position={position}>
      <mesh material={materials}>
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
      </mesh>
      {stickerFaces.map((face, i) => (
        <StickerFace
          key={i}
          position={face.pos}
          rotation={face.rot}
          stickerUrl={face.url}
        />
      ))}
      {highlight && (
        <mesh>
          <boxGeometry args={[CUBIE_SIZE + 0.02, CUBIE_SIZE + 0.02, CUBIE_SIZE + 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}

interface AnimatedFaceProps {
  move: Move;
  state: CubeState;
  size: CubeSize;
  stickerImages?: string[];
  progress: number; // 0 to 1
}

function AnimatedFace({ move, state, size, stickerImages, progress }: AnimatedFaceProps) {
  const half = (size - 1) / 2;
  const step = size === 2 ? 1 : 1;

  const { axis, selector } = useMemo(() => {
    switch (move.face) {
      case "R":
        return { axis: "x" as const, selector: (x: number) => x > half - 0.5 };
      case "L":
        return { axis: "x" as const, selector: (x: number) => x < -half + 0.5 };
      case "U":
        return { axis: "y" as const, selector: (y: number) => y > half - 0.5 };
      case "D":
        return { axis: "y" as const, selector: (y: number) => y < -half + 0.5 };
      case "F":
        return { axis: "z" as const, selector: (z: number) => z > half - 0.5 };
      case "B":
        return { axis: "z" as const, selector: (z: number) => z < -half + 0.5 };
      default:
        return { axis: "x" as const, selector: () => false };
    }
  }, [move.face, half]);

  const angle = useMemo(() => {
    let base = Math.PI / 2;
    if (move.direction === "2") base = Math.PI;
    if (move.direction === "'") base = -Math.PI / 2;
    return base * progress;
  }, [move.direction, progress]);

  const positions: [number, number, number][] = [];
  for (let ix = 0; ix < size; ix++) {
    for (let iy = 0; iy < size; iy++) {
      for (let iz = 0; iz < size; iz++) {
        const px = -half + ix * step;
        const py = -half + iy * step;
        const pz = -half + iz * step;
        const val = axis === "x" ? px : axis === "y" ? py : pz;
        if (selector(val)) {
          positions.push([px, py, pz]);
        }
      }
    }
  }

  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    if (axis === "x") groupRef.current.rotation.x = angle;
    if (axis === "y") groupRef.current.rotation.y = angle;
    if (axis === "z") groupRef.current.rotation.z = angle;
  }, [angle, axis]);

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <Cubie key={i} position={pos} state={state} size={size} stickerImages={stickerImages} />
      ))}
    </group>
  );
}

interface CubeModelProps {
  state: CubeState;
  size: CubeSize;
  stickerImages?: string[];
  currentMove?: Move | null;
  moveProgress?: number; // 0 to 1
}

function CubeModel({ state, size, stickerImages, currentMove, moveProgress = 0 }: CubeModelProps) {
  const half = (size - 1) / 2;
  const step = size === 2 ? 1 : 1;

  if (currentMove && moveProgress > 0 && moveProgress < 1) {
    const animatingPositions = new Set<string>();
    const { axis, selector } = getFaceSelector(currentMove.face, half);

    for (let ix = 0; ix < size; ix++) {
      for (let iy = 0; iy < size; iy++) {
        for (let iz = 0; iz < size; iz++) {
          const px = -half + ix * step;
          const py = -half + iy * step;
          const pz = -half + iz * step;
          const val = axis === "x" ? px : axis === "y" ? py : pz;
          if (selector(val)) {
            animatingPositions.add(`${px},${py},${pz}`);
          }
        }
      }
    }

    const staticPositions: [number, number, number][] = [];
    for (let ix = 0; ix < size; ix++) {
      for (let iy = 0; iy < size; iy++) {
        for (let iz = 0; iz < size; iz++) {
          const px = -half + ix * step;
          const py = -half + iy * step;
          const pz = -half + iz * step;
          if (!animatingPositions.has(`${px},${py},${pz}`)) {
            staticPositions.push([px, py, pz]);
          }
        }
      }
    }

    return (
      <group>
        {staticPositions.map((pos, i) => (
          <Cubie key={`s-${i}`} position={pos} state={state} size={size} stickerImages={stickerImages} />
        ))}
        <AnimatedFace
          move={currentMove}
          state={state}
          size={size}
          stickerImages={stickerImages}
          progress={moveProgress}
        />
      </group>
    );
  }

  const positions: [number, number, number][] = [];
  for (let ix = 0; ix < size; ix++) {
    for (let iy = 0; iy < size; iy++) {
      for (let iz = 0; iz < size; iz++) {
        positions.push([-half + ix * step, -half + iy * step, -half + iz * step]);
      }
    }
  }

  return (
    <group>
      {positions.map((pos, i) => (
        <Cubie key={i} position={pos} state={state} size={size} stickerImages={stickerImages} />
      ))}
    </group>
  );
}

function getFaceSelector(
  face: FaceColor,
  half: number
) {
  switch (face) {
    case "R":
      return { axis: "x" as const, selector: (v: number) => v > half - 0.5 };
    case "L":
      return { axis: "x" as const, selector: (v: number) => v < -half + 0.5 };
    case "U":
      return { axis: "y" as const, selector: (v: number) => v > half - 0.5 };
    case "D":
      return { axis: "y" as const, selector: (v: number) => v < -half + 0.5 };
    case "F":
      return { axis: "z" as const, selector: (v: number) => v > half - 0.5 };
    case "B":
      return { axis: "z" as const, selector: (v: number) => v < -half + 0.5 };
    default:
      return { axis: "x" as const, selector: () => false };
  }
}

interface CubeViewerProps {
  state: CubeState;
  size: CubeSize;
  stickerImages?: string[];
  currentMove?: Move | null;
  moveProgress?: number;
  className?: string;
}

export function CubeViewer({
  state,
  size,
  stickerImages,
  currentMove,
  moveProgress,
  className,
}: CubeViewerProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [4, 3, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />
        <directionalLight position={[-3, 2, -4]} intensity={0.3} />
        <CubeModel
          state={state}
          size={size}
          stickerImages={stickerImages}
          currentMove={currentMove}
          moveProgress={moveProgress}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={12}
        />
      </Canvas>
    </div>
  );
}
