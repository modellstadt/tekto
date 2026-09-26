/**
 * @deprecated the flat-mesh generators moved into `MeshFactory` (one factory for the
 * one `Mesh` class). This shim keeps deep imports compiling for one release.
 */
export { MeshFactory as FlatMeshGen } from "../geometry/mesh/MeshFactory";
