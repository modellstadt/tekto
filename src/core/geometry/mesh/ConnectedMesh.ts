/**
 * @deprecated `ConnectedMesh` merged into `Mesh` (one class, typed-array storage,
 * full connectivity). This shim keeps deep imports compiling for one release.
 */
export { Mesh as ConnectedMesh, Mesh } from "./Mesh";
export type { MeshNode, MeshEdge, MeshFace, MeshJSON } from "./Mesh";
