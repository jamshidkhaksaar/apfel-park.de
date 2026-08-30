import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  transactionQuery: vi.fn(),
  withTransaction: vi.fn(),
  removeEstimatePdf: vi.fn(),
  writeEstimatePdf: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  query: mocks.query,
  withTransaction: mocks.withTransaction,
}));

vi.mock("@/lib/repair-estimate-auth", () => ({
  requireRepairEstimateUser: vi.fn(async () => ({
    user: { id: "admin-id", email: "admin@apfel-park.de" },
  })),
}));

vi.mock("@/lib/admin-csrf", () => ({
  rejectCrossSiteAdminMutation: vi.fn(() => null),
}));

vi.mock("@/lib/repair-estimate-pdf", () => ({
  renderRepairEstimatePdf: vi.fn(async () => Buffer.from("test-pdf")),
}));

vi.mock("@/lib/repair-estimate-settings", () => ({
  getEstimateTemplateSettings: vi.fn(async () => ({})),
}));

vi.mock("@/lib/repair-estimate-storage", () => ({
  removeEstimatePdf: mocks.removeEstimatePdf,
  writeEstimatePdf: mocks.writeEstimatePdf,
}));

vi.mock("@/lib/repair-estimates", () => ({
  calculateEstimateTotals: vi.fn(() => ({ grossCents: 12900 })),
  normalizeEstimatePayload: vi.fn(() => ({ language: "de" })),
  validateEstimatePayload: vi.fn(() => []),
}));

import { POST } from "@/app/api/admin/repair-estimates/[id]/issue/route";

const estimateId = "11111111-1111-4111-8111-111111111111";
const request = (): NextRequest => new NextRequest(
  `https://apfel-park.de/api/admin/repair-estimates/${estimateId}/issue`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionToken: 7 }),
  },
);

const estimate = {
  id: estimateId,
  estimate_number: "KVA-2026-001",
  current_revision: 0,
  version_token: 7,
  draft_payload: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockImplementation(async (sql) => ({
    rows: String(sql).includes("SELECT * FROM repair_estimates") ? [estimate] : [],
  }));
  mocks.writeEstimatePdf.mockResolvedValue(`repair-estimates/${estimateId}/1-test.pdf`);
  mocks.removeEstimatePdf.mockResolvedValue(undefined);
  mocks.withTransaction.mockImplementation(async (work) => work({ query: mocks.transactionQuery }));
});

describe("repair estimate issuance", () => {
  it("commits the version and linked repair cost through one transaction", async () => {
    mocks.transactionQuery
      .mockResolvedValueOnce({
        rows: [{ id: "version-id", repair_id: "repair-id", version_token: 8 }],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const response = await POST(request(), { params: Promise.resolve({ id: estimateId }) });

    expect(response.status).toBe(200);
    expect(mocks.withTransaction).toHaveBeenCalledOnce();
    expect(String(mocks.transactionQuery.mock.calls[0][0])).toContain("INSERT INTO repair_estimate_versions");
    expect(String(mocks.transactionQuery.mock.calls[1][0])).toContain("UPDATE repairs SET estimated_cost");
    expect(mocks.removeEstimatePdf).not.toHaveBeenCalled();
  });

  it("removes the uncommitted PDF if the linked repair update aborts issuance", async () => {
    mocks.transactionQuery
      .mockResolvedValueOnce({
        rows: [{ id: "version-id", repair_id: "repair-id", version_token: 8 }],
      })
      .mockRejectedValueOnce(new Error("repair update failed"));

    const response = await POST(request(), { params: Promise.resolve({ id: estimateId }) });

    expect(response.status).toBe(500);
    expect(mocks.removeEstimatePdf).toHaveBeenCalledWith(
      `repair-estimates/${estimateId}/1-test.pdf`,
    );
  });

  it("removes the uncommitted PDF when optimistic locking loses the race", async () => {
    mocks.transactionQuery.mockResolvedValueOnce({ rows: [] });

    const response = await POST(request(), { params: Promise.resolve({ id: estimateId }) });

    expect(response.status).toBe(409);
    expect(mocks.removeEstimatePdf).toHaveBeenCalledWith(
      `repair-estimates/${estimateId}/1-test.pdf`,
    );
  });

  it("preserves and returns a version committed despite a lost COMMIT acknowledgement", async () => {
    const committedVersion = {
      id: "version-id",
      repair_id: "repair-id",
      version_token: 8,
    };
    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [committedVersion] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    mocks.withTransaction.mockImplementationOnce(async (work) => {
      await work({ query: mocks.transactionQuery });
      throw new Error("connection lost after COMMIT");
    });
    mocks.query.mockImplementation(async (sql) => ({
      rows: String(sql).includes("SELECT * FROM repair_estimates")
        ? [estimate]
        : [committedVersion],
    }));

    const response = await POST(request(), { params: Promise.resolve({ id: estimateId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ version: committedVersion, reconciled: true });
    const [reconciliationSql, reconciliationParams] = mocks.query.mock.calls[1];
    expect(String(reconciliationSql)).toContain("v.estimate_id = $1");
    expect(String(reconciliationSql)).toContain("v.revision = $2");
    expect(String(reconciliationSql)).toContain("v.pdf_path = $3");
    expect(String(reconciliationSql)).toContain("v.pdf_sha256 = $4");
    expect(reconciliationParams).toEqual([
      estimateId,
      1,
      `repair-estimates/${estimateId}/1-test.pdf`,
      expect.stringMatching(/^[a-f0-9]{64}$/),
    ]);
    expect(mocks.removeEstimatePdf).not.toHaveBeenCalled();
  });

  it("preserves the PDF when an indeterminate transaction cannot be reconciled", async () => {
    mocks.withTransaction.mockRejectedValueOnce(new Error("commit outcome unknown"));
    mocks.query
      .mockResolvedValueOnce({ rows: [estimate] })
      .mockRejectedValueOnce(new Error("database unavailable"));

    const response = await POST(request(), { params: Promise.resolve({ id: estimateId }) });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.code).toBe("ISSUANCE_STATUS_UNKNOWN");
    expect(mocks.removeEstimatePdf).not.toHaveBeenCalled();
  });

  it("rolls back when a linked repair row cannot be updated", async () => {
    mocks.transactionQuery
      .mockResolvedValueOnce({
        rows: [{ id: "version-id", repair_id: "missing-repair", version_token: 8 }],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await POST(request(), { params: Promise.resolve({ id: estimateId }) });

    expect(response.status).toBe(500);
    expect(mocks.removeEstimatePdf).toHaveBeenCalledOnce();
  });

  it("keeps the optimistic-lock response when PDF cleanup fails", async () => {
    mocks.transactionQuery.mockResolvedValueOnce({ rows: [] });
    mocks.removeEstimatePdf.mockRejectedValueOnce(new Error("storage unavailable"));

    const response = await POST(request(), { params: Promise.resolve({ id: estimateId }) });

    expect(response.status).toBe(409);
  });
});
