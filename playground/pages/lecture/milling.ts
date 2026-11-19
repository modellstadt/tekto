// CNC milling, in section. A block is carved into a relief in two stages.
// Roughing: a flat end mill removes material in horizontal levels (step-down),
// leaving a staircase a little above the surface. Finishing: a ball-nose tool
// follows the surface in parallel passes (step-over), leaving small scallops
// between passes. Everything is computed on a 1D section so it runs instantly.

import type { AppFactory } from "./shared";
import { P, BAR, clear, hatch, text, line, FONT_SMALL } from "./shared";
import type { Pt } from "./shared";

const L = 300, TOP = 80, N = 900;   // section length and stock height in mm, samples
const dx = L / (N - 1);
const X = Array.from({ length: N }, (_, i) => i * dx);

const SURFACES: Record<string, (x: number) => number> = {
  "Vault": (x) => 18 + 48 * Math.sin((Math.PI * x) / L) ** 0.8,
  "Relief": (x) => 30 + 16 * Math.sin(x / 19) + 10 * Math.sin(x / 7 + 1) + 12 * Math.exp(-(((x - 190) / 25) ** 2)),
  "Mouldings": (x) => {
    const u = x % 100;
    return u < 20 ? 20 : u < 35 ? 20 + (u - 20) * 2.4 : u < 55 ? 56 + 10 * Math.sin(((u - 35) / 20) * Math.PI) : u < 70 ? 56 - (u - 55) * 1.6 : 32;
  },
};

export const milling: AppFactory = () => ({
  title: "CNC milling: roughing and finishing",
  height: 520,
  fn: (lab) => {
    const surf = lab.select("Surface", Object.keys(SURFACES) as readonly string[], "Relief").value;
    const stage = lab.select("Show", ["Roughing", "Roughing + finishing"] as const, "Roughing", { group: "Strategy" }).value;
    const stepDown = lab.slider("Step-down mm", 2, 20, 8, { step: 0.5, group: "Roughing (flat end mill)" }).value;
    const flatD = lab.slider("Tool diameter mm", 4, 40, 16, { step: 1, group: "Roughing (flat end mill)" }).value;
    const allow = lab.slider("Stock to leave mm", 0, 3, 1, { step: 0.1, group: "Roughing (flat end mill)" }).value;
    const ballD = lab.slider("Ball diameter mm", 2, 20, 8, { step: 0.5, group: "Finishing (ball nose)" }).value;
    const stepOver = lab.slider("Step-over mm", 0.5, 12, 3, { step: 0.5, group: "Finishing (ball nose)" }).value;
    const showTool = lab.toggle("Show tools", true, { group: "Strategy" }).value;

    const f = SURFACES[surf];
    const target = X.map(f);
    // ── roughing: for each level, where can the flat tool go without cutting below target + allowance?
    const R = flatD / 2, ri = Math.ceil(R / dx);
    const maxAround = target.map((_, i) => { let m = -Infinity; for (let j = Math.max(0, i - ri); j <= Math.min(N - 1, i + ri); j++) m = Math.max(m, target[j]); return m; });
    const rough = new Float64Array(N).fill(TOP);
    let levels = 0, roughPath = 0;
    for (let z = TOP - stepDown; z > 0; z -= stepDown) {
      levels++;
      const ok = maxAround.map((m) => m + allow <= z);
      ok.forEach((o, c) => {
        if (!o) return;
        roughPath += dx;
        for (let j = Math.max(0, c - ri); j <= Math.min(N - 1, c + ri); j++) rough[j] = Math.min(rough[j], z);
      });
    }
    // ── finishing: ball centres every step-over, touching the surface from above
    const r = ballD / 2, rb = Math.ceil(r / dx);
    const finish = Float64Array.from(rough);
    const passes: Pt[] = [];
    if (stage !== "Roughing") {
      for (let xc = 0; xc <= L; xc += stepOver) {
        const ic = Math.round(xc / dx);
        let cz = -Infinity;
        for (let j = Math.max(0, ic - rb); j <= Math.min(N - 1, ic + rb); j++) {
          const ddx = X[j] - xc;
          if (Math.abs(ddx) <= r) cz = Math.max(cz, target[j] + Math.sqrt(r * r - ddx * ddx));
        }
        passes.push([xc, cz]);
        for (let j = Math.max(0, ic - rb); j <= Math.min(N - 1, ic + rb); j++) {
          const ddx = X[j] - xc;
          if (Math.abs(ddx) <= r) finish[j] = Math.min(finish[j], cz - Math.sqrt(r * r - ddx * ddx));
        }
      }
    }
    const result = stage === "Roughing" ? rough : finish;
    let excess = 0, maxEx = 0;
    for (let i = 0; i < N; i++) { const e = result[i] - target[i]; excess += e * dx; maxEx = Math.max(maxEx, e); }
    const scallop = r - Math.sqrt(Math.max(0, r * r - (stepOver / 2) ** 2));
    lab.log("Roughing", `${levels} levels`);
    if (stage !== "Roughing") lab.log("Finishing", `${passes.length} passes, scallop ≈ ${scallop.toFixed(2)} mm`);
    lab.log("Material left over the surface", `max ${maxEx.toFixed(1)} mm`);

    lab.draw((ctx, w, hh) => {
      clear(ctx, w, hh);
      const h = hh - BAR;
      const pad = 24;
      const sc = Math.min((w - 2 * pad) / L, (h * 0.62) / TOP);
      const ox = (w - L * sc) / 2, oy = pad + TOP * sc + 20;
      const SX = (x: number) => ox + x * sc, SY = (z: number) => oy - z * sc;
      // removed stock: hatched outline of the block
      ctx.strokeStyle = P.grey(0.3); ctx.lineWidth = 1;
      ctx.strokeRect(SX(0), SY(TOP), L * sc, TOP * sc);
      const removed: Pt[] = [[SX(0), SY(TOP)], [SX(L), SY(TOP)], ...X.map((x, i) => [SX(x), SY(result[i])] as Pt).reverse()];
      ctx.strokeStyle = P.grey(0.35); hatch(ctx, removed, 5, Math.PI / 4, 0.5);
      // remaining part
      const part: Pt[] = [[SX(0), SY(0)], ...X.map((x, i) => [SX(x), SY(result[i])] as Pt), [SX(L), SY(0)]];
      ctx.fillStyle = P.grey(0.14); ctx.beginPath(); part.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4; ctx.beginPath(); X.forEach((x, i) => (i ? ctx.lineTo(SX(x), SY(result[i])) : ctx.moveTo(SX(x), SY(result[i])))); ctx.stroke();
      // the designed surface
      ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
      ctx.beginPath(); X.forEach((x, i) => (i ? ctx.lineTo(SX(x), SY(target[i])) : ctx.moveTo(SX(x), SY(target[i])))); ctx.stroke(); ctx.setLineDash([]);
      // tools
      if (showTool) {
        const xr = L * 0.3, ir = Math.round(xr / dx);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2; ctx.fillStyle = P.paper;
        const zt = rough[ir];
        ctx.fillRect(SX(xr - R), SY(zt + 40), 2 * R * sc, 40 * sc); ctx.strokeRect(SX(xr - R), SY(zt + 40), 2 * R * sc, 40 * sc);
        if (stage !== "Roughing" && passes.length) {
          const pp = passes[Math.floor(passes.length * 0.7)];
          ctx.beginPath(); ctx.arc(SX(pp[0]), SY(pp[1]), r * sc, 0, Math.PI); ctx.lineTo(SX(pp[0] - r), SY(pp[1] + 40)); ctx.lineTo(SX(pp[0] + r), SY(pp[1] + 40)); ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
      }
      // magnified detail: 5× zoom on a short stretch
      const zx0 = L * 0.55, zw = 30, zs = Math.min((w - 2 * pad) * 0.45 / zw, 14);
      const bx = w - pad - zw * zs, by = oy + 30, bh = Math.min(h - by - 10, 120);
      if (bh > 40) {
        const i0 = Math.round(zx0 / dx), i1 = Math.round((zx0 + zw) / dx);
        let zc = 0; for (let i = i0; i <= i1; i++) zc += target[i] / (i1 - i0 + 1);
        ctx.strokeStyle = P.grey(0.4); ctx.lineWidth = 1; ctx.strokeRect(bx, by, zw * zs, bh);
        ctx.save(); ctx.beginPath(); ctx.rect(bx, by, zw * zs, bh); ctx.clip();
        const ZX = (x: number) => bx + (x - zx0) * zs, ZY = (z: number) => by + bh / 2 - (z - zc) * zs;
        ctx.fillStyle = P.grey(0.14); ctx.beginPath(); ctx.moveTo(ZX(zx0), by + bh);
        for (let i = i0; i <= i1; i++) ctx.lineTo(ZX(X[i]), ZY(result[i]));
        ctx.lineTo(ZX(zx0 + zw), by + bh); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4; ctx.beginPath();
        for (let i = i0; i <= i1; i++) (i === i0 ? ctx.moveTo : ctx.lineTo).call(ctx, ZX(X[i]), ZY(result[i]));
        ctx.stroke();
        ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]); ctx.beginPath();
        for (let i = i0; i <= i1; i++) (i === i0 ? ctx.moveTo : ctx.lineTo).call(ctx, ZX(X[i]), ZY(target[i]));
        ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.fillStyle = P.grey(0.55);
        text(ctx, `detail, ${zw} mm wide`, bx, by - 5, "left", "alphabetic", FONT_SMALL);
        ctx.strokeStyle = P.grey(0.4); ctx.setLineDash([2, 2]);
        line(ctx, SX(zx0), SY(TOP) - 4, SX(zx0 + zw), SY(TOP) - 4); ctx.setLineDash([]);
      }
      ctx.fillStyle = P.grey(0.55);
      text(ctx, `section through a ${L} mm block: designed surface dashed, removed material hatched`, pad, 16, "left", "alphabetic", FONT_SMALL);
    });
  },
});
