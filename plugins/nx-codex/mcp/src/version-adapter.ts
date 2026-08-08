import type { BridgeOperation } from "./protocol.js";

export const READ_ONLY_CAPABILITIES = [
  "health",
  "get_capabilities",
  "get_session_state",
  "get_assembly_capability",
  "get_drafting_capability",
  "get_cae_capability",
  "get_cam_capability",
] as const satisfies readonly BridgeOperation[];

export const NX12_0_2_9_CAPABILITIES = [
  ...READ_ONLY_CAPABILITIES,
  "get_assembly_structure",
  "get_drafting_structure",
  "create_test_drawing",
  "preflight_modeling",
  "get_feature_tree",
  "capture_screenshot",
  "new_part",
  "open_part",
  "save_as",
  "close_part",
  "create_block",
  "create_rectangle_sketch",
  "extrude_sketch",
  "revolve_sketch",
  "create_simple_through_hole",
  "boolean_bodies",
  "fillet_vertical_edges",
  "measure_work_part",
  "export_step",
  "undo_transaction",
] as const satisfies readonly BridgeOperation[];

export type VersionProfile = {
  adapterId: string;
  adapterContractId: string;
  compatibilityStatus: "verified" | "unsupported";
  nxOpenAssemblyVersion: string;
  capabilities: readonly BridgeOperation[];
};

export function selectVersionProfile(nxOpenAssemblyVersion: string): VersionProfile {
  if (nxOpenAssemblyVersion === "12.0.2.9") {
    return {
      adapterId: "nx12.0.2.9",
      adapterContractId: "nx12.0.2.9-required-api-v1",
      compatibilityStatus: "verified",
      nxOpenAssemblyVersion,
      capabilities: NX12_0_2_9_CAPABILITIES,
    };
  }
  return {
    adapterId: `unsupported:${nxOpenAssemblyVersion}`,
    adapterContractId: "none",
    compatibilityStatus: "unsupported",
    nxOpenAssemblyVersion,
    capabilities: READ_ONLY_CAPABILITIES,
  };
}
