/**
 * The axis widget in the corner of a viewport.
 *
 * It exists because the Viewport already knew how to be a plan or an
 * elevation and no user could ask it to: `setView` and `setProjection` were
 * public, tested, and unreachable from every application built on them. A
 * capability with no affordance is a capability nobody has.
 *
 * Drawn as SVG rather than a second WebGL scene. It stays crisp at any device
 * pixel ratio, it costs no context (a browser allows only a handful, and this
 * library already fights for them), and hit testing is what the DOM does for a
 * living: each ball is an element, so a click is a click rather than a
 * raycast.
 *
 * What it shows is the *content's* axes, not the world's. A Z-up model is
 * rotated into a Y-up scene by `setUp`, and a gizmo that reported the scene's
 * axes would tell an engineer their Z was horizontal.
 */
import * as THREE from "three";

/** Blender's convention, which is most people's. */
const AXES: { axis: "x" | "y" | "z"; dir: THREE.Vector3; colour: string }[] = [
  { axis: "x", dir: new THREE.Vector3(1, 0, 0), colour: "#e0566a" },
  { axis: "y", dir: new THREE.Vector3(0, 1, 0), colour: "#7fb648" },
  { axis: "z", dir: new THREE.Vector3(0, 0, 1), colour: "#4b8fd6" },
];

const SVG = "http://www.w3.org/2000/svg";

export interface NavGizmoOptions {
  /** Pixels. The ball radius and font scale with it. */
  size?: number;
  /** Which corner of the host it sits in. */
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Distance from the two edges of that corner, in pixels. */
  inset?: number;
  /**
   * Whether to show the projection toggle under the axes.
   *
   * On by default, and not decoration either: clicking an axis gets you a face
   * view, but a face view in perspective is a photograph of a building taken
   * from the front, with the far corner smaller than the near one. An
   * elevation is the orthographic one. Having reached the view and not the
   * convention, a reader is one control short of the drawing they asked for.
   */
  projectionToggle?: boolean;
  /** Look down this direction, in content space. The viewport animates. */
  onAxis: (direction: THREE.Vector3) => void;
  /** Drag on the gizmo, in pixels, to orbit. */
  onDrag: (dx: number, dy: number) => void;
  /** Double click: snap to whichever axis the view is already nearest. */
  onSnap: () => void;
  /** Flip between perspective and orthographic. */
  onProjection?: () => void;
}

interface Ball {
  el: SVGGElement;
  circle: SVGCircleElement;
  label: SVGTextElement | null;
  line: SVGLineElement | null;
  dir: THREE.Vector3;            // content space
  colour: string;
  positive: boolean;
  name: string;
}

export class NavGizmo {
  private root: HTMLDivElement;
  private svg: SVGSVGElement;
  private balls: Ball[] = [];
  private projectionButton: HTMLButtonElement | null = null;
  private size: number;
  private centre: number;
  private reach: number;
  private ballR: number;
  private scratch = new THREE.Vector3();
  private inverse = new THREE.Quaternion();
  /** Set while a drag is under way, so the click that ends one is not read as
   *  a click on whichever ball happened to be under the pointer. */
  private moved = false;
  /** The window listeners a drag needs, dropped in one go on dispose. */
  private listeners = new AbortController();

  constructor(host: HTMLElement, private opts: NavGizmoOptions) {
    this.size = opts.size ?? 88;
    this.centre = this.size / 2;
    this.ballR = Math.max(7, this.size * 0.105);
    // the axis reach stops short of the edge so a ball never clips
    this.reach = this.centre - this.ballR - 2;

    this.root = document.createElement("div");
    const corner = opts.corner ?? "bottom-right";
    const inset = `${opts.inset ?? 12}px`;
    this.root.style.cssText = `position:absolute;width:${this.size}px;
      ${corner.includes("top") ? "top" : "bottom"}:${inset};
      ${corner.includes("left") ? "left" : "right"}:${inset};
      cursor:grab;touch-action:none;user-select:none;z-index:5;
      display:flex;flex-direction:column;align-items:center;gap:2px`;

    this.svg = document.createElementNS(SVG, "svg") as SVGSVGElement;
    this.svg.setAttribute("viewBox", `0 0 ${this.size} ${this.size}`);
    this.svg.setAttribute("width", String(this.size));
    this.svg.setAttribute("height", String(this.size));
    this.root.append(this.svg);

    for (const { axis, dir, colour } of AXES) {
      for (const positive of [true, false]) {
        this.balls.push(this.makeBall(
          positive ? dir.clone() : dir.clone().negate(),
          colour, positive, positive ? axis.toUpperCase() : `-${axis.toUpperCase()}`));
      }
    }
    if (opts.onProjection && opts.projectionToggle !== false) {
      this.projectionButton = this.makeProjectionToggle();
      this.root.append(this.projectionButton);
    }
    this.bind();
    // the widget is positioned against the host, so the host has to be a
    // containing block. Read the computed value, not the inline one: a host
    // positioned by a stylesheet has an empty `style.position` and would be
    // overwritten to relative, moving somebody's absolutely placed panel.
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.append(this.root);
  }

  private makeBall(dir: THREE.Vector3, colour: string, positive: boolean, name: string): Ball {
    const g = document.createElementNS(SVG, "g") as SVGGElement;
    g.style.cursor = "pointer";
    let line: SVGLineElement | null = null;
    if (positive) {
      // only the positive half draws a spoke, or the widget reads as a star
      line = document.createElementNS(SVG, "line") as SVGLineElement;
      line.setAttribute("stroke", colour);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linecap", "round");
      g.append(line);
    }
    const circle = document.createElementNS(SVG, "circle") as SVGCircleElement;
    circle.setAttribute("r", String(this.ballR));
    circle.setAttribute("stroke", colour);
    circle.setAttribute("stroke-width", "1.5");
    g.append(circle);

    let label: SVGTextElement | null = null;
    if (positive) {
      label = document.createElementNS(SVG, "text") as SVGTextElement;
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.setAttribute("font-size", String(this.ballR * 1.25));
      label.setAttribute("font-family", "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif");
      label.setAttribute("font-weight", "600");
      label.setAttribute("fill", "#fff");
      label.setAttribute("pointer-events", "none");
      label.textContent = name;
      g.append(label);
    }
    // A ball grows a little under the pointer. Without it nothing says the
    // widget answers a click at all, and it reads as a legend.
    g.addEventListener("pointerenter", () => {
      circle.setAttribute("r", String(this.ballR * 1.25));
      circle.setAttribute("stroke-width", "2.5");
    });
    g.addEventListener("pointerleave", () => {
      circle.setAttribute("r", String(this.ballR));
      circle.setAttribute("stroke-width", "1.5");
    });
    // A drag that starts on a ball still orbits, and does not then also count
    // as a click on it: a browser fires click when down and up share a target.
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this.moved) this.opts.onAxis(dir.clone());
    });
    this.svg.append(g);
    return { el: g, circle, label, line, dir, colour, positive, name };
  }

  /**
   * The projection toggle: a caption that names the convention in force and
   * changes it when clicked, rather than an icon nobody can read at 9 pixels.
   */
  private makeProjectionToggle(): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "persp";
    b.title = "Perspective or orthographic. An elevation is the orthographic one.";
    b.style.cssText = `font:600 9px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      letter-spacing:.06em;text-transform:uppercase;padding:3px 6px;border-radius:4px;
      border:1px solid rgba(90,100,110,.35);background:rgba(255,255,255,.82);
      color:#5a646e;cursor:pointer;pointer-events:auto`;
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => { e.stopPropagation(); this.opts.onProjection?.(); });
    return b;
  }

  /** Tell the widget which projection is in force, so its caption is true. */
  setProjection(projection: "perspective" | "orthographic") {
    if (!this.projectionButton) return;
    const ortho = projection === "orthographic";
    this.projectionButton.textContent = ortho ? "ortho" : "persp";
    this.projectionButton.style.background = ortho ? "#1b2733" : "rgba(255,255,255,.82)";
    this.projectionButton.style.color = ortho ? "#fff" : "#5a646e";
  }

  private bind() {
    let dragging = false, lx = 0, ly = 0;
    // A drag is followed on the window rather than through setPointerCapture.
    // Capture would be the obvious choice and is the wrong one here: a captured
    // pointer retargets the click at the end of a drag to the capturing
    // element, so every click on an axis ball was delivered to the container
    // instead and the widget turned into a decoration you could only drag.
    this.root.addEventListener("pointerdown", (e) => {
      dragging = true; this.moved = false; lx = e.clientX; ly = e.clientY;
      this.root.style.cursor = "grabbing";
      e.preventDefault();                 // no text selection, no image drag
    });
    globalThis.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.moved = true;
      this.opts.onDrag(dx, dy);
      lx = e.clientX; ly = e.clientY;
    }, { signal: this.listeners.signal });
    const end = () => { dragging = false; this.root.style.cursor = "grab"; };
    globalThis.addEventListener("pointerup", end, { signal: this.listeners.signal });
    globalThis.addEventListener("pointercancel", end, { signal: this.listeners.signal });
    this.root.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (!this.moved) this.opts.onSnap();
    });
  }

  /**
   * Redraw for the current camera.
   *
   * `contentRotation` carries the root's own turn, so the labels describe the
   * model's axes rather than the scene's.
   */
  update(camera: THREE.Camera, contentRotation: THREE.Quaternion) {
    this.inverse.copy(camera.quaternion).invert();
    const placed = this.balls.map((ball) => {
      // content space -> world -> camera space
      const v = this.scratch.copy(ball.dir)
        .applyQuaternion(contentRotation)
        .applyQuaternion(this.inverse);
      return {
        ball,
        x: this.centre + v.x * this.reach,
        y: this.centre - v.y * this.reach,
        depth: v.z,                       // the camera looks down -Z
      };
    });
    // farthest first, so a near ball covers the spoke behind it
    placed.sort((a, b) => a.depth - b.depth);

    for (const { ball, x, y, depth } of placed) {
      this.svg.append(ball.el);           // re-appending sets the paint order
      ball.circle.setAttribute("cx", String(x));
      ball.circle.setAttribute("cy", String(y));
      // an axis pointing away is hollow and dimmer: the drawing says which
      // half of the model you are looking at before you read a letter
      const away = depth < 0;
      ball.circle.setAttribute("fill", ball.positive && !away ? ball.colour : "#ffffff");
      ball.el.setAttribute("opacity", away ? "0.55" : "1");
      if (ball.label) {
        ball.label.setAttribute("x", String(x));
        ball.label.setAttribute("y", String(y));
        ball.label.setAttribute("fill", away ? ball.colour : "#ffffff");
      }
      if (ball.line) {
        ball.line.setAttribute("x1", String(this.centre));
        ball.line.setAttribute("y1", String(this.centre));
        ball.line.setAttribute("x2", String(x));
        ball.line.setAttribute("y2", String(y));
      }
    }
  }

  setVisible(on: boolean) { this.root.style.display = on ? "" : "none"; }

  dispose() {
    this.listeners.abort();               // or a disposed widget keeps orbiting
    this.root.remove();
  }
}
