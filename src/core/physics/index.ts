/**
 * Tekto Physics — Spring-mass simulation with truss support, hinge springs,
 * force clamping, velocity damping, and floor collision.
 *
 * Mirrors HDGEO.Core.Physics.SpringSystem3DHinge.
 */

import { Vec3 } from "../math/vectors";
import { ConnectedMesh } from "../geometry/mesh/ConnectedMesh";
import { HPlane } from "../geometry/HPlane";

// ─── Spring ──────────────────────────────────

export interface Spring {
  i: number;
  j: number;
  restLength: number;
  k: number;
}

// ─── SpringSystem3D ──────────────────────────

export class SpringSystem3D {
  pos: Vec3[] = [];
  vel: Vec3[] = [];
  invMass: Float32Array = new Float32Array(0);
  springs: Spring[] = [];

  // Settings
  gravity = new Vec3(0, -9.81, 0);
  floorPlane = new HPlane(new Vec3(0, 0, 1), -10);
  globalVelDamping = 0.02;

  useGlobalStiffness = true;
  globalStiffness = 200;
  globalDamping = 2;

  stiffnessStrut = 2000;
  stiffnessShear = 1000;
  stiffnessHinge = 500;

  maxForce = 100000;

  // ── Init from mesh ──

  initFromMesh(mesh: ConnectedMesh, trussThickness = 0, useHinges = true): void {
    const useTruss = Math.abs(trussThickness) > 0.001;
    const nodes = mesh.nodesArray();
    const layer1Count = nodes.length;
    const totalCount = useTruss ? layer1Count * 2 : layer1Count;

    // Build node ID → array index mapping
    const idToIdx = new Map<number, number>();
    for (let i = 0; i < nodes.length; i++) {
      idToIdx.set(nodes[i].id, i);
    }

    // Allocate arrays
    this.pos = new Array(totalCount);
    this.vel = new Array(totalCount);
    this.invMass = new Float32Array(totalCount);
    this.springs = [];

    // Layer 1
    for (let i = 0; i < layer1Count; i++) {
      this.pos[i] = nodes[i].position;
      this.vel[i] = Vec3.zero();
      this.invMass[i] = 1;
    }

    // Layer 2 (ghost truss)
    if (useTruss) {
      const normals = this.computeSmoothNormals(mesh, nodes, idToIdx);
      for (let i = 0; i < layer1Count; i++) {
        const ghostIdx = i + layer1Count;
        this.pos[ghostIdx] = this.pos[i].sub(normals[i].mul(trussThickness));
        this.vel[ghostIdx] = Vec3.zero();
        this.invMass[ghostIdx] = 1;

        // Vertical strut connecting layers
        this.addSpring(i, ghostIdx, this.stiffnessStrut);
      }
    }

    // Create edge springs + cross bracing
    for (const edge of mesh.edges()) {
      const u = idToIdx.get(edge.nodes[0])!;
      const v = idToIdx.get(edge.nodes[1])!;

      this.addSpring(u, v, this.stiffnessStrut);

      if (useTruss) {
        const u2 = u + layer1Count;
        const v2 = v + layer1Count;
        this.addSpring(u2, v2, this.stiffnessStrut);
        this.addSpring(u, v2, this.stiffnessShear);
        this.addSpring(v, u2, this.stiffnessShear);
      }
    }

    // Surface shear (quad diagonals)
    for (const face of mesh.faces()) {
      if (face.nodes.length === 4) {
        const [a, b, c, d] = face.nodes.map(n => idToIdx.get(n)!);
        this.addSpring(a, c, this.stiffnessShear);
        this.addSpring(b, d, this.stiffnessShear);

        if (useTruss) {
          this.addSpring(a + layer1Count, c + layer1Count, this.stiffnessShear);
          this.addSpring(b + layer1Count, d + layer1Count, this.stiffnessShear);
        }
      }
    }

    // Hinge springs (bending resistance)
    if (useHinges) this.addBendingSprings(mesh, idToIdx);
  }

  private computeSmoothNormals(
    mesh: ConnectedMesh, nodes: ReturnType<ConnectedMesh["nodesArray"]>,
    idToIdx: Map<number, number>,
  ): Vec3[] {
    const normals = new Array<Vec3>(nodes.length).fill(Vec3.zero());

    for (const face of mesh.faces()) {
      if (face.nodes.length < 3) continue;
      const pA = mesh.node(face.nodes[0])!.position;
      const pB = mesh.node(face.nodes[1])!.position;
      const pC = mesh.node(face.nodes[2])!.position;
      const n = pB.sub(pA).cross(pC.sub(pA)).normalize();

      for (const nid of face.nodes) {
        const idx = idToIdx.get(nid)!;
        normals[idx] = normals[idx].add(n);
      }
    }

    for (let i = 0; i < normals.length; i++) {
      normals[i] = normals[i].lenSq() > 0 ? normals[i].normalize() : new Vec3(0, 0, 1);
    }
    return normals;
  }

  private addBendingSprings(mesh: ConnectedMesh, idToIdx: Map<number, number>): void {
    for (const edge of mesh.edges()) {
      if (edge.faces.length < 2) continue;
      const fA = mesh.face(edge.faces[0]);
      const fB = mesh.face(edge.faces[1]);
      if (!fA || !fB) continue;

      const wingA = this.getOppositeVertex(fA.nodes, edge.nodes[0], edge.nodes[1]);
      const wingB = this.getOppositeVertex(fB.nodes, edge.nodes[0], edge.nodes[1]);
      if (wingA !== -1 && wingB !== -1) {
        this.addSpring(idToIdx.get(wingA)!, idToIdx.get(wingB)!, this.stiffnessHinge);
      }
    }
  }

  private getOppositeVertex(faceNodes: number[], v1: number, v2: number): number {
    for (const n of faceNodes) {
      if (n !== v1 && n !== v2) return n;
    }
    return -1;
  }

  // ── Spring management ──

  addSpring(i: number, j: number, k = 200): void {
    if (i < 0 || i >= this.pos.length || j < 0 || j >= this.pos.length) return;
    const restLength = this.pos[i].sub(this.pos[j]).len();
    this.springs.push({ i, j, restLength, k });
  }

  // ── Pin/unpin vertices ──

  pin(index: number): void { this.invMass[index] = 0; }
  unpin(index: number): void { this.invMass[index] = 1; }

  // ── Simulation step ──

  step(dt: number, substeps = 8): void {
    if (substeps < 1) substeps = 1;
    const h = dt / substeps;
    const count = this.pos.length;
    const force = new Array<Vec3>(count);

    for (let s = 0; s < substeps; s++) {
      // Clear forces
      for (let i = 0; i < count; i++) force[i] = Vec3.zero();

      // Gravity
      for (let i = 0; i < count; i++) {
        if (this.invMass[i] > 0)
          force[i] = force[i].add(this.gravity.mul(1 / this.invMass[i]));
      }

      // Springs
      for (const sp of this.springs) {
        const d = this.pos[sp.j].sub(this.pos[sp.i]);
        const len = d.len();
        if (isNaN(len) || len < 1e-8) continue;

        const n = d.mul(1 / len);
        const stretch = len - sp.restLength;
        const currentK = this.useGlobalStiffness ? this.globalStiffness : sp.k;
        const fs = currentK * stretch;

        const vRel = this.vel[sp.j].sub(this.vel[sp.i]).dot(n);
        const fd = this.globalDamping * vRel;

        let f = n.mul(fs + fd);

        // Clamp explosive forces
        const magSq = f.dot(f);
        if (magSq > this.maxForce * this.maxForce)
          f = f.normalize().mul(this.maxForce);

        force[sp.i] = force[sp.i].add(f);
        force[sp.j] = force[sp.j].sub(f);
      }

      // Integration
      for (let i = 0; i < count; i++) {
        if (this.invMass[i] === 0) continue;

        const accel = force[i].mul(this.invMass[i]);
        this.vel[i] = this.vel[i].add(accel.mul(h));
        this.vel[i] = this.vel[i].mul(1 - this.globalVelDamping);
        this.pos[i] = this.pos[i].add(this.vel[i].mul(h));

        // NaN safety
        if (isNaN(this.pos[i].x) || isNaN(this.pos[i].y) || isNaN(this.pos[i].z)) {
          this.pos[i] = Vec3.zero();
          this.vel[i] = Vec3.zero();
        }

        // Floor collision
        const dist = this.floorPlane.distToPoint(this.pos[i]);
        if (dist < 0) {
          this.pos[i] = this.pos[i].sub(this.floorPlane.normal.mul(dist));
          const vNormal = this.vel[i].dot(this.floorPlane.normal);
          if (vNormal < 0)
            this.vel[i] = this.vel[i].sub(this.floorPlane.normal.mul(vNormal * 1.3));
        }
      }
    }
  }

  // ── Update mesh from simulation ──

  updateMesh(mesh: ConnectedMesh): void {
    const nodes = mesh.nodesArray();
    if (this.pos.length < nodes.length) return;

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].position = this.pos[i];
    }
    mesh.computeVertexNormals();
  }
}
