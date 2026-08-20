import type { JsonObject } from "./types";

export type ProductRevision = {
  id: string;
  productId: string;
  runId: string | null;
  revisionNumber: number;
  actorType: string;
  actorId: string;
  beforeSnapshot: JsonObject;
  afterSnapshot: JsonObject;
  changedPaths: string[];
  acceptedHash: string | null;
  mode: "shadow" | "live";
  createdAt: string;
};
