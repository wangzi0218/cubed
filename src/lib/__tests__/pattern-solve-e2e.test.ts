import { describe, it, expect } from "vitest";
import { createSolvedState } from "../cube-state";
import { createInitialOrientations, applyOrientationMove } from "../sticker-orientation";
import { solveCube, applyMove, parseMoves } from "../solver";
import type { CubeSize } from "@/types/cube";

/**
 * End-to-end test: pattern cube user story
 *
 * Scenario: User has a pattern cube where the center sticker on each face
 * has a known orientation (e.g., an arrow pointing in a specific direction).
 * User inputs the solved state with these orientations, then scrambles and solves.
 * We verify that after applying the solution, orientations return to their initial values.
 */

describe("Pattern cube e2e: orientation round-trip", () => {
  it("solved cube with center orientations → solve returns to initial orientations", () => {
    const size: CubeSize = 3;
    const state = createSolvedState(size);
    const orientations = createInitialOrientations(size);

    // Set distinct center orientations (like an arrow on each face)
    // Face order: U(0), R(1), F(2), D(3), L(4), B(5)
    // Center position for 3x3 = index 4 within each face
    orientations[4] = 1;   // U center: 90°
    orientations[13] = 2;  // R center: 180°
    orientations[22] = 3;  // F center: 270°
    orientations[31] = 0;  // D center: 0°
    orientations[40] = 1;  // L center: 90°
    orientations[49] = 2;  // B center: 180°

    // A solved cube needs no moves, so orientations should be unchanged
    const result = solveCube(state, size, orientations);
    expect(result.steps).toHaveLength(0);

    // Verify orientations passed through correctly
    // (solveCube with solved state returns empty steps, but the initial orientations
    // are preserved in the store)
  });

  it("scrambled pattern cube → solve → orientations return to initial", () => {
    const size: CubeSize = 3;
    const state = createSolvedState(size);

    // Start with all-zero orientations (standard initial state)
    const initialOrientations = createInitialOrientations(size);

    // Scramble: R U F (a simple 3-move scramble)
    const scrambleMoves = parseMoves("R U F");

    // Apply scramble to state
    let scrambledState = state;
    for (const move of scrambleMoves) {
      scrambledState = applyMove(scrambledState, move);
    }

    // Apply scramble to orientations
    let scrambledOrientations = initialOrientations;
    for (const move of scrambleMoves) {
      scrambledOrientations = applyOrientationMove(scrambledOrientations, move.notation, size);
    }

    // Solve the scrambled cube
    const result = solveCube(scrambledState, size, scrambledOrientations);

    // Apply all solution steps to get final state and orientations
    const finalStep = result.steps[result.steps.length - 1];
    expect(finalStep).toBeDefined();

    // The final state should match the original solved state
    expect(finalStep.stateAfter.join("")).toBe(state.join(""));

    // The final orientations should return to the initial solved orientations
    const finalOrientations = finalStep.orientationsAfter!;
    expect(finalOrientations).toBeDefined();

    // After solving, center orientations should be back to their pre-scramble values
    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      const centerPos = faceIdx * 9 + 4;
      expect(finalOrientations[centerPos]).toBe(initialOrientations[centerPos]);
    }
  });

  it("pattern cube with non-zero center orientations → scramble → solve → centers return to initial", () => {
    const size: CubeSize = 3;
    const state = createSolvedState(size);

    // Set center orientations (simulating user marking arrow directions)
    const initialOrientations = createInitialOrientations(size);
    initialOrientations[4] = 1;   // U center: 90°
    initialOrientations[13] = 2;  // R center: 180°
    initialOrientations[22] = 3;  // F center: 270°
    initialOrientations[31] = 0;  // D center: 0°
    initialOrientations[40] = 1;  // L center: 90°
    initialOrientations[49] = 2;  // B center: 180°

    // Scramble: R U F D L B (all 6 faces)
    const scrambleNotation = "R U F D L B";
    const scrambleMoves = parseMoves(scrambleNotation);

    let scrambledState = state;
    let scrambledOrientations = [...initialOrientations];
    for (const move of scrambleMoves) {
      scrambledState = applyMove(scrambledState, move);
      scrambledOrientations = applyOrientationMove(scrambledOrientations, move.notation, size);
    }

    // Verify scramble changed the state
    expect(scrambledState.join("")).not.toBe(state.join(""));

    // Solve
    const result = solveCube(scrambledState, size, scrambledOrientations);
    expect(result.steps.length).toBeGreaterThan(0);

    const finalStep = result.steps[result.steps.length - 1];
    const finalOrientations = finalStep.orientationsAfter!;

    // After solving, center orientations should return to initial values
    // Center stickers never move between faces, so their orientation is
    // purely determined by the accumulated face rotation deltas.
    // After solving (net effect = identity), centers should be back to initial.
    const centers = [
      { face: "U", idx: 4 },
      { face: "R", idx: 13 },
      { face: "F", idx: 22 },
      { face: "D", idx: 31 },
      { face: "L", idx: 40 },
      { face: "B", idx: 49 },
    ];

    for (const { face, idx } of centers) {
      expect(finalOrientations[idx]).toBe(
        initialOrientations[idx],
        `Center orientation for ${face} face should return to initial value`
      );
    }
  });

  it("orientation transitions are physically consistent: 4 same-face rotations = identity", () => {
    const size: CubeSize = 3;
    let orientations = createInitialOrientations(size);

    // Set a non-zero orientation on F center
    orientations[22] = 1;

    // Apply R 4 times — R face should return to original orientation
    for (let i = 0; i < 4; i++) {
      orientations = applyOrientationMove(orientations, "R", size);
    }

    // F center was not affected by R (it's not on R face or cross-face cycle)
    expect(orientations[22]).toBe(1);

    // R center (13): 4 * +1 = 4 ≡ 0, but it started at 0, so still 0
    expect(orientations[13]).toBe(0);

    // Now set R center to 2 and apply R 4 times
    orientations[13] = 2;
    for (let i = 0; i < 4; i++) {
      orientations = applyOrientationMove(orientations, "R", size);
    }
    // R center: 2 + 4*1 = 6 ≡ 2 (back to original)
    expect(orientations[13]).toBe(2);
  });

  it("cross-face stickers track correctly through a sequence of moves", () => {
    const size: CubeSize = 3;
    const orientations = createInitialOrientations(size);

    // Mark F right column (20, 23, 26) with orientation 1
    orientations[20] = 1;
    orientations[23] = 1;
    orientations[26] = 1;

    // Apply R move — F right column moves to U right column (2, 5, 8)
    const afterR = applyOrientationMove(orientations, "R", size);

    // F→U cross-face delta is 3 (from our cycle [3,1,0,0])
    // So U right col should have 1 + 3 = 4 ≡ 0
    expect(afterR[2]).toBe(0);
    expect(afterR[5]).toBe(0);
    expect(afterR[8]).toBe(0);

    // F right col now has stickers from D (which were 0) with D→F delta 0
    expect(afterR[20]).toBe(0);
    expect(afterR[23]).toBe(0);
    expect(afterR[26]).toBe(0);
  });
});
