/**
 * Shared Editing — one NURBS curve that everybody on this dev server edits together.
 *
 * Open the page in two windows (or send the link to someone on your network) and drag the
 * control points: the other window follows. The points live in a SharedStore on the dev server
 * (devServerAdapter + tools/collab-vite-plugin.mjs → .tekto/collab/shared-editing.json; edit
 * that file and the windows follow too). Presence: the badges top right; a point somebody
 * else is dragging is ringed in their colour. "Sign in" sets the name the others see.
 */
import { sketch, Vec3, NurbsCurve, SharedStore, devServerAdapter, PresenceBar } from "../../src";

type XYZ = [number, number, number];
const START: XYZ[] = [[-3, 0, 0], [-1, 0, 2.5], [1, 0, -2.5], [3, 0, 0]];
const KNOTS = [0, 0, 0, 0, 1, 1, 1, 1];

export default function (container: HTMLElement): { dispose(): void } {
  const store = new SharedStore<XYZ>({ doc: "shared-editing", adapter: devServerAdapter() });
  let bar: PresenceBar | null = null;
  let last = "—";   // the last change: which point, by whom
  const inst = sketch((lab) => {
    lab.once(() => {
      bar = new PresenceBar(store, lab.viewport, { describe: (p) => (p.state.dragging ? `dragging ${p.state.dragging}` : undefined) });
      store.onChange((keys, source) => {
        last = `${keys.join(", ")} by ${source === "local" ? "you" : store.meta(keys[0])?.by || "?"}`;
        lab.invalidate();
      });
      store.onPresence(() => lab.invalidate());
      store.onStatus(() => lab.invalidate());
      store.connect().catch((e) => lab.log("Shared editing", `no dev server endpoint (${e.message})`));
    });
    const cps = START.map((p, i) => new Vec3(...(store.get(`p${i}`) ?? p)));
    const curve = new NurbsCurve(cps, 3, KNOTS);
    const pts: Vec3[] = [];
    for (let i = 0; i <= 64; i++) pts.push(curve.getPoint(i / 64));
    lab.polyline(pts).color("#f2b35a");
    lab.polyline(cps).color("#555a6e");

    const dragging = lab.activeDragHandle;
    if (!dragging) store.setPresence({ dragging: null });
    lab.handles(cps.map((p, i) => ({ p, i })), {
      key: (d) => `cp-${d.i}`,
      position: (d) => d.p,
      space: () => ({ kind: "plane", origin: new Vec3(0, 0, 0), normal: new Vec3(0, 1, 0) }),
      color: "#38d9a9",
      onDrag: (d, q) => {
        store.set(`p${d.i}`, [q.x, q.y, q.z]);
        store.setPresence({ dragging: `p${d.i}` });
      },
    });
    // the points the others are dragging, ringed in their colour
    for (const o of store.others) {
      const k = o.state.dragging as string | null;
      const i = k ? Number(k.slice(1)) : -1;
      if (i >= 0 && i < cps.length) lab.sphere(0.22, 16, 10).color(o.color).translate(cps[i].x, cps[i].y, cps[i].z);
    }
    lab.log("Status", store.status);
    lab.log("Online", store.presence.map((p) => p.user.name).join(", ") || "—");
    lab.log("Last change", last);
    lab.info("Open this page in a second window and drag the points.");
  }, {
    container,
    title: "Shared Editing",
    background: 0x0a0b14,
    camera: [0, 9, 0.01],
    target: [0, 0, 0],
  });
  return { dispose() { bar?.destroy(); store.disconnect(); inst.dispose(); } };
}
