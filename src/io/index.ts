/**
 * Tekto IO — Wavefront OBJ file import/export.
 *
 * Mirrors HDGEO.Core.IO.ObjFile.
 */

import { Vec2, Vec3 } from "../core/math/vectors";

// ─── MeshData (interchange format) ──────────

export interface MeshData {
  positions: Vec3[];
  normals: Vec3[];
  uvs: Vec2[];
  faces: number[][];
  /**
   * Optional OBJ group ranges. Populated by `ObjFile.parse` whenever the
   * file contains `g <name>` directives. Each entry is a contiguous run
   * of face indices that share the named group — used by consumers
   * (e.g. the stair app's FEM/streamline pipeline) to keep sub-meshes
   * separable after the file is loaded.
   */
  groups?: { name: string; faceStart: number; faceCount: number }[];
}

function emptyMeshData(): MeshData {
  return { positions: [], normals: [], uvs: [], faces: [], groups: [] };
}

// ─── ObjFile ─────────────────────────────────

export const ObjFile = {
  /** Parses an OBJ string into MeshData. Handles v/vt/vn/f lines. */
  parse(source: string): MeshData {
    const result = emptyMeshData();
    const rawPositions: Vec3[] = [];
    const rawUVs: Vec2[] = [];
    const rawNormals: Vec3[] = [];
    const indexCache = new Map<string, number>();
    // Active group while walking face lines — `null` means "no active
    // group yet". Switched on `g <name>` directives; flushed into
    // `result.groups` when the active name changes or the file ends.
    let activeGroup: string | null = null;
    let activeGroupFaceStart = 0;

    const flushGroup = () => {
      if (activeGroup === null) return;
      const count = result.faces.length - activeGroupFaceStart;
      if (count > 0) {
        result.groups!.push({
          name: activeGroup,
          faceStart: activeGroupFaceStart,
          faceCount: count,
        });
      }
    };

    for (const line of source.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed[0] === "#") continue;

      const parts = trimmed.split(/\s+/);
      const type = parts[0];

      if (type === "g" && parts.length >= 2) {
        flushGroup();
        activeGroup = parts.slice(1).join(" ");
        activeGroupFaceStart = result.faces.length;
        continue;
      }
      if (type === "v" && parts.length >= 4) {
        rawPositions.push(new Vec3(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ));
      } else if (type === "vt" && parts.length >= 3) {
        rawUVs.push(new Vec2(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
        ));
      } else if (type === "vn" && parts.length >= 4) {
        rawNormals.push(new Vec3(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ));
      } else if (type === "f" && parts.length >= 4) {
        const faceIndices: number[] = [];
        for (let i = 1; i < parts.length; i++) {
          const block = parts[i];
          const key = block; // Use raw block string as cache key

          let finalIndex = indexCache.get(key);
          if (finalIndex === undefined) {
            const { p, t, n } = parseObjIndex(block, rawPositions.length, rawUVs.length, rawNormals.length);

            result.positions.push(rawPositions[p]);

            if (t >= 0) result.uvs.push(rawUVs[t]);
            else if (result.uvs.length > 0) result.uvs.push(Vec2.zero());

            if (n >= 0) result.normals.push(rawNormals[n]);
            else if (result.normals.length > 0) result.normals.push(new Vec3(0, 1, 0));

            finalIndex = result.positions.length - 1;
            indexCache.set(key, finalIndex);
          }

          faceIndices.push(finalIndex);
        }
        result.faces.push(faceIndices);
      }
    }

    flushGroup();
    if (result.groups!.length === 0) result.groups = undefined;
    return result;
  },

  /** Serializes MeshData to an OBJ format string. */
  serialize(data: MeshData): string {
    const lines: string[] = [];
    lines.push("# Exported by Tekto");
    lines.push(`# Vertices: ${data.positions.length}`);
    lines.push(`# Faces: ${data.faces.length}`);

    for (const v of data.positions)
      lines.push(`v ${f(v.x)} ${f(v.y)} ${f(v.z)}`);

    for (const vt of data.uvs)
      lines.push(`vt ${f(vt.x)} ${f(vt.y)}`);

    for (const vn of data.normals)
      lines.push(`vn ${f(vn.x)} ${f(vn.y)} ${f(vn.z)}`);

    const hasUV = data.uvs.length > 0;
    const hasNorm = data.normals.length > 0;

    for (const face of data.faces) {
      let line = "f";
      for (const idx of face) {
        const val = idx + 1; // OBJ is 1-based
        if (hasUV && hasNorm) line += ` ${val}/${val}/${val}`;
        else if (hasUV) line += ` ${val}/${val}`;
        else if (hasNorm) line += ` ${val}//${val}`;
        else line += ` ${val}`;
      }
      lines.push(line);
    }

    return lines.join("\n") + "\n";
  },
};

// ─── Helpers ─────────────────────────────────

function f(v: number): string {
  return v.toFixed(6).replace(/\.?0+$/, "");
}

function parseObjIndex(
  block: string, pCount: number, tCount: number, nCount: number,
): { p: number; t: number; n: number } {
  const bits = block.split("/");

  let p = parseInt(bits[0], 10);
  let t = -1;
  let n = -1;

  if (bits.length > 1 && bits[1] !== "") t = parseInt(bits[1], 10);
  if (bits.length > 2 && bits[2] !== "") n = parseInt(bits[2], 10);

  // Handle negative (relative) indices and convert to 0-based
  if (p < 0) p = pCount + p; else p--;
  if (t < 0) t = tCount + t; else if (t > 0) t--;
  if (n < 0) n = nCount + n; else if (n > 0) n--;

  return { p, t, n };
}
