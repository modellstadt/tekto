/**
 * Tekto IO — Wavefront OBJ file import/export.
 *
 * Mirrors HDGEO.Core.IO.ObjFile.
 */

import { Vec2, Vec3 } from "../core/math/vectors";
import { parseHex } from "./PdfWriter";

// ─── MeshData (interchange format) ──────────

/** A polygon mesh as OBJ holds it (exported as `ObjMeshData`; not `Mesh`'s typed-array `MeshData`): parallel per-vertex positions, uvs and normals (the last two may be empty), 0-based `faces` into them, and optional `g` group ranges with their `usemtl` materials. */
export interface MeshData {
  positions: Vec3[];
  normals: Vec3[];
  uvs: Vec2[];
  faces: number[][];
  /**
   * Optional OBJ group runs: each a contiguous range of faces under one `g` name and, when
   * set, one `usemtl` material. `ObjFile.parse` fills it whenever the file has `g` or
   * `usemtl` lines (a material change starts a new run under the same name), and
   * `ObjFile.serialize` writes it back — used by consumers (e.g. the stair app's
   * FEM/streamline pipeline, a CAD import) to keep sub-meshes separable after the file is
   * loaded. Several runs may share a name.
   */
  groups?: { name: string; faceStart: number; faceCount: number; material?: string }[];
  /**
   * The materials the groups name, with their colours, for `ObjFile.serializeMtl`.
   * `Scene.toMeshData({ groupBy })` fills it; `parse` leaves it unset (it reads no .mtl
   * file) and `serialize` doesn't write it.
   */
  materials?: ObjMaterial[];
}

/** A material of an OBJ's .mtl file, for `ObjFile.serializeMtl`: its name (as a group's `material` gives it), its colour as CSS hex (`"#9cc8e8"`) or [r, g, b] in 0..1, and its opacity, 1 by default. */
export interface ObjMaterial {
  name: string;
  color: string | [number, number, number];
  opacity?: number;
}

function emptyMeshData(): MeshData {
  return { positions: [], normals: [], uvs: [], faces: [], groups: [] };
}

// ─── ObjFile ─────────────────────────────────

/**
 * Wavefront OBJ text to and from `ObjMeshData` with its `g` groups and `usemtl` materials, plus
 * the .mtl (`serializeMtl`); coordinates pass through unchanged (no axis swap or unit scaling).
 *
 *   const data = scene.toMeshData({ groupBy: "layer" });
 *   download(ObjFile.serializeMtl(data.materials!), "model.mtl");
 *   download(ObjFile.serialize(data, { mtllib: "model.mtl" }), "model.obj");
 */
export const ObjFile = {
  /**
   * Parses an OBJ string into MeshData: v/vt/vn/f lines, `g` groups and `usemtl` materials
   * (`mtllib` is skipped — the .mtl is a separate file). A `g` or a `usemtl` that changes the
   * material starts a new group run; as in OBJ, a material carries over into the next `g`,
   * and a `usemtl` before any `g` runs under `"default"`. `groups` stays unset when the file
   * has neither.
   */
  parse(source: string): MeshData {
    const result = emptyMeshData();
    const rawPositions: Vec3[] = [];
    const rawUVs: Vec2[] = [];
    const rawNormals: Vec3[] = [];
    const indexCache = new Map<string, number>();
    // The current group run — `null` name means "no group yet". A run ends on `g <name>` or
    // on a `usemtl` that changes the material, and is flushed into `result.groups` then and
    // at the end of the file.
    let runName: string | null = null;
    let runMaterial: string | undefined;
    let runFaceStart = 0;

    const flushRun = () => {
      if (runName === null) return;
      const count = result.faces.length - runFaceStart;
      if (count > 0) {
        result.groups!.push({
          name: runName,
          faceStart: runFaceStart,
          faceCount: count,
          ...(runMaterial !== undefined ? { material: runMaterial } : {}),
        });
      }
    };
    const startRun = (name: string, material: string | undefined) => {
      flushRun();
      runName = name;
      runMaterial = material;
      runFaceStart = result.faces.length;
    };

    for (const line of source.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed[0] === "#") continue;

      const parts = trimmed.split(/\s+/);
      const type = parts[0];

      if (type === "g" && parts.length >= 2) {
        startRun(parts.slice(1).join(" "), runMaterial);
        continue;
      }
      if (type === "usemtl" && parts.length >= 2) {
        const material = parts.slice(1).join(" ");
        if (runName === null || material !== runMaterial) startRun(runName ?? "default", material);
        continue;
      }
      if (type === "mtllib") continue;
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

    flushRun();
    if (result.groups!.length === 0) result.groups = undefined;
    return result;
  },

  /**
   * Serializes MeshData to an OBJ format string. `mtllib` names the .mtl file the materials
   * are in (see `serializeMtl`). Faces in no group come first, then each group as a
   * `g <name>` line, `usemtl <material>` when it has one, and its faces, in the order of
   * `groups` — so `parse` gives the same groups back. Whitespace in group and material names
   * becomes `_` (OBJ names are single tokens). OBJ cannot turn a material off: a group without
   * one, written after a group with one, reads back with that material.
   */
  serialize(data: MeshData, options: { mtllib?: string } = {}): string {
    const lines: string[] = [];
    lines.push("# Exported by Tekto");
    lines.push(`# Vertices: ${data.positions.length}`);
    lines.push(`# Faces: ${data.faces.length}`);
    if (options.mtllib) lines.push(`mtllib ${options.mtllib}`);

    for (const v of data.positions)
      lines.push(`v ${f(v.x)} ${f(v.y)} ${f(v.z)}`);

    for (const vt of data.uvs)
      lines.push(`vt ${f(vt.x)} ${f(vt.y)}`);

    for (const vn of data.normals)
      lines.push(`vn ${f(vn.x)} ${f(vn.y)} ${f(vn.z)}`);

    const hasUV = data.uvs.length > 0;
    const hasNorm = data.normals.length > 0;

    const faceLine = (face: number[]) => {
      let line = "f";
      for (const idx of face) {
        const val = idx + 1; // OBJ is 1-based
        if (hasUV && hasNorm) line += ` ${val}/${val}/${val}`;
        else if (hasUV) line += ` ${val}/${val}`;
        else if (hasNorm) line += ` ${val}//${val}`;
        else line += ` ${val}`;
      }
      return line;
    };

    const groups = data.groups ?? [];
    const grouped = new Uint8Array(data.faces.length);
    for (const g of groups) {
      const end = g.faceStart + g.faceCount;
      if (!(Number.isInteger(g.faceStart) && Number.isInteger(g.faceCount) && g.faceStart >= 0 && g.faceCount >= 0 && end <= data.faces.length)) {
        throw new Error(`ObjFile.serialize: group "${g.name}" covers faces ${g.faceStart}..${end - 1}, but there are ${data.faces.length} faces`);
      }
      for (let i = g.faceStart; i < end; i++) {
        if (grouped[i]) throw new Error(`ObjFile.serialize: face ${i} is in group "${g.name}" and in an earlier one`);
        grouped[i] = 1;
      }
    }

    for (let i = 0; i < data.faces.length; i++) if (!grouped[i]) lines.push(faceLine(data.faces[i]));
    for (const g of groups) {
      if (g.faceCount === 0) continue;
      lines.push(`g ${objName(g.name)}`);
      if (g.material !== undefined) lines.push(`usemtl ${objName(g.material)}`);
      for (let i = g.faceStart; i < g.faceStart + g.faceCount; i++) lines.push(faceLine(data.faces[i]));
    }

    return lines.join("\n") + "\n";
  },

  /**
   * The .mtl file for an OBJ's materials: per material `newmtl`, a small ambient `Ka` (a tenth
   * of the colour), the colour as `Kd` and the opacity as `d`. Names get the same `_` for
   * whitespace as in `serialize`. Throws on a colour that is neither CSS hex nor [r, g, b] in
   * 0..1, or an opacity outside 0..1.
   *
   *   ObjFile.serializeMtl([{ name: "glass", color: "#9cc8e8", opacity: 0.45 }]);
   */
  serializeMtl(materials: ObjMaterial[]): string {
    const AMBIENT = 0.1;
    const lines: string[] = ["# Exported by Tekto", `# Materials: ${materials.length}`];
    for (const m of materials) {
      const rgb = typeof m.color === "string" ? parseHex(m.color) : m.color;
      if (!rgb || rgb.length !== 3 || !rgb.every(c => Number.isFinite(c) && c >= 0 && c <= 1)) {
        throw new Error(`ObjFile.serializeMtl: material "${m.name}" has the colour ${JSON.stringify(m.color)}; give CSS hex ("#rrggbb") or [r, g, b] in 0..1`);
      }
      const opacity = m.opacity ?? 1;
      if (!(opacity >= 0 && opacity <= 1)) throw new Error(`ObjFile.serializeMtl: material "${m.name}" has the opacity ${m.opacity}; give 0..1`);
      lines.push(
        "",
        `newmtl ${objName(m.name)}`,
        `Ka ${rgb.map(c => f(c * AMBIENT)).join(" ")}`,
        `Kd ${rgb.map(f).join(" ")}`,
        `d ${f(opacity)}`,
      );
    }
    return lines.join("\n") + "\n";
  },
};

/**
 * The material a scene colour stands for in an OBJ: named `c_rrggbb`, with `_a<percent>`
 * below full opacity (`c_9cc8e8_a45`), so objects of one colour share it. A colour that is
 * not CSS hex (a name like `"tomato"`) keeps its name but exports grey, so the .mtl still
 * writes. Internal — `Scene.toMeshData` names its groups' materials with it.
 */
export function colorMaterial(color: string, opacity = 1): ObjMaterial {
  const NOT_HEX = "#808080";
  const rgb = parseHex(color);
  const hex = rgb ? rgb.map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("") : objName(color);
  const alpha = opacity < 1 ? `_a${Math.round(opacity * 100)}` : "";
  return { name: `c_${hex}${alpha}`, color: rgb ? color : NOT_HEX, opacity };
}

// ─── Helpers ─────────────────────────────────

function f(v: number): string {
  return v.toFixed(6).replace(/\.?0+$/, "");
}

/** A group or material name as one OBJ token: whitespace → `_`, an empty name → "default". */
function objName(name: string): string {
  return name.trim().replace(/\s+/g, "_") || "default";
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
