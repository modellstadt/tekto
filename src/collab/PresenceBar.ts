/**
 * PresenceBar — who is online in a SharedStore document: a dot for the connection, one round
 * badge per person (their colour, initials or GitHub avatar; tooltip = name and what they are
 * on), and a Sign in / Sign out button. Sits in the viewport's top bar row, left of ✎ Markup.
 */
import type { CollabStatus, Presence, SharedStore } from "./SharedStore";

export interface PresenceBarOptions {
  /** CSS for the bar's position inside the host; default: top right, left of ✎ Markup. */
  position?: string;
  /** Tooltip line per person, from their presence state (e.g. "editing ch218.0"). */
  describe?: (p: Presence) => string | undefined;
}

const STATUS_COL: Record<CollabStatus, string> = { online: "#2f9e44", connecting: "#f08c00", offline: "#adb5bd", error: "#e03131" };

export class PresenceBar {
  readonly el: HTMLDivElement;
  private dot: HTMLSpanElement;
  private people: HTMLDivElement;
  private btn: HTMLButtonElement;
  private unsubs: (() => void)[] = [];

  constructor(private store: SharedStore<unknown>, host: HTMLElement, private opts: PresenceBarOptions = {}) {
    this.el = document.createElement("div");
    this.el.style.cssText = `position:absolute;${opts.position ?? "top:10px;right:100px;"}z-index:22;display:flex;gap:6px;align-items:center;`
      + "font:12px system-ui,sans-serif;background:#fff;border:1px solid #d0d0d6;border-radius:7px;padding:3px 6px;box-shadow:0 2px 8px rgba(0,0,0,.12);";
    this.dot = document.createElement("span");
    this.dot.style.cssText = "width:8px;height:8px;border-radius:50%;display:inline-block;";
    this.people = document.createElement("div");
    this.people.style.cssText = "display:flex;gap:3px;align-items:center;";
    this.btn = document.createElement("button");
    this.btn.style.cssText = "font:12px system-ui,sans-serif;padding:3px 8px;border-radius:5px;border:1px solid #d0d0d6;background:#fff;color:#222;cursor:pointer;";
    this.btn.addEventListener("click", () => void (store.user ? store.signOut() : store.signIn()));
    this.el.append(this.dot, this.people, this.btn);
    host.appendChild(this.el);
    this.unsubs.push(store.onPresence(() => this.render()), store.onStatus(() => this.render()), store.onUser(() => this.render()));
    this.render();
  }

  destroy(): void {
    for (const u of this.unsubs) u();
    this.el.remove();
  }

  render(): void {
    const st = this.store.status;
    this.dot.style.background = STATUS_COL[st];
    this.dot.title = `shared editing: ${st}`;
    const user = this.store.user;
    this.btn.textContent = user ? "Sign out" : "Sign in";
    this.btn.title = user ? `Signed in as ${user.name}` : "Sign in to edit together";
    this.people.replaceChildren();
    const seen = new Set<string>();   // one badge per person (several tabs → one)
    for (const p of this.store.presence) {
      if (seen.has(p.user.id)) continue;
      seen.add(p.user.id);
      const b = document.createElement("span");
      const me = p.session === this.store.session;
      b.style.cssText = `width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;`
        + `font:600 10px system-ui,sans-serif;color:#fff;background:${p.color};box-shadow:0 0 0 2px ${me ? "#222" : "#fff"};overflow:hidden;`;
      if (p.user.avatarUrl) {
        const img = document.createElement("img");
        img.src = p.user.avatarUrl; img.alt = ""; img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        b.appendChild(img);
      } else {
        b.textContent = p.user.name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
      }
      const what = this.opts.describe?.(p);
      b.title = `${p.user.name}${me ? " (you)" : ""}${what ? ` — ${what}` : ""}`;
      this.people.appendChild(b);
    }
  }
}
