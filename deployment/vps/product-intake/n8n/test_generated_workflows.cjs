/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const generated = path.join(__dirname, "generated");
const env = {
  N8N_OWNER_KEY_ID: "owner",
  N8N_OWNER_HMAC_SECRET: "o".repeat(64),
  N8N_INTAKE_HMAC_SECRET: "s".repeat(64),
  PRODUCT_INTAKE_SUBMIT_KEY_ID: "n8n-submit-v2",
  PRODUCT_INTAKE_SUBMIT_SECRET: "a".repeat(64),
  PRODUCT_INTAKE_OWNER_KEY_ID: "n8n-owner-v2",
  PRODUCT_INTAKE_OWNER_SECRET: "b".repeat(64),
};

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
const signature = ({ keyId, timestamp, method = "POST", requestPath, idem = "", body, secret }) => {
  const canonical = ["APFEL-PRODUCT-INTAKE-V1", keyId, timestamp, method, requestPath, idem, digest(body)].join("\n");
  return crypto.createHmac("sha256", secret).update(canonical).digest("hex");
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(generated, `${id}.json`), "utf8"));
const runCode = (id, nodeName, json) => {
  const workflow = load(id);
  const code = workflow.nodes.find((node) => node.name === nodeName).parameters.jsCode;
  return new Function("$json", "$env", "require", code)(json, env, require);
};

for (const file of fs.readdirSync(generated).filter((name) => name.endsWith(".json"))) {
  const workflow = JSON.parse(fs.readFileSync(path.join(generated, file), "utf8"));
  assert.equal(workflow.active, false, `${file} must import inactive`);
  assert.equal(workflow.settings.saveExecutionProgress, false, `${file} must not persist execution progress`);
  assert.equal(workflow.settings.saveDataErrorExecution, "none", `${file} must not persist failed payloads`);
  assert.equal(workflow.settings.saveDataSuccessExecution, "none", `${file} must not persist successful payloads`);
  assert.equal(workflow.nodes.some((node) => node.type === "n8n-nodes-base.wait"), false, `${file} must not contain Wait nodes`);
  if (workflow.id !== "APF99ERRORV2") assert.equal(workflow.settings.errorWorkflow, "APF99ERRORV2", `${file} must route failures to APF-99`);
  for (const node of workflow.nodes) {
    if (typeof node.parameters?.jsCode === "string") new Function(node.parameters.jsCode);
    if (["Create Intake Run", "Record Decision", "Forward to App"].includes(node.name)) {
      assert.equal(node.parameters.contentType, "raw", `${file} must preserve the HMAC-signed raw JSON body`);
      assert.equal(node.parameters.body, "={{ $json.appRaw }}", `${file} must send the exact signed body`);
    }
  }
}
const startWorkflow = load("APF01INTAKEV2");
assert.deepEqual(
  new Set(startWorkflow.connections["Create Intake Run"].main[0].map((entry) => entry.node)),
  new Set(["Respond"]),
  "The durable run response must not depend on notification delivery",
);

const timestamp = String(Math.floor(Date.now() / 1000));
const startBody = {
  source: "safi_bot",
  sourceReference: "APF-TEST01",
  condition: "sealed",
  submittedBy: "ignored",
  submittedByRole: "safi",
  locale: "de",
  payload: { modelInput: "iPhone 17" },
};
const startRaw = JSON.stringify(startBody);
const startIdem = "safi:test-start";
const startResult = runCode("APF01INTAKEV2", "Verify Start", {
  body: startBody,
  headers: {
    "x-apfel-intake-key-id": "safi-bot",
    "x-apfel-intake-timestamp": timestamp,
    "x-apfel-intake-signature": signature({
      keyId: "safi-bot", timestamp, requestPath: "/webhook/apfel-intake-v2", idem: startIdem,
      body: startRaw, secret: env.N8N_INTAKE_HMAC_SECRET,
    }),
    "idempotency-key": startIdem,
  },
})[0].json;
assert.equal(startResult.appBody.submittedByRole, "safi");
assert.equal(startResult.appBody.submittedBy, "safi-bot");
assert.equal(startResult.appSignature, signature({
  keyId: "n8n-submit-v2", timestamp: startResult.appTime,
  requestPath: "/api/integrations/product-intake/runs", idem: startIdem,
  body: JSON.stringify(startResult.appBody), secret: env.PRODUCT_INTAKE_SUBMIT_SECRET,
}));

const runId = "00000000-0000-4000-8000-000000000001";
const proposalBody = { runId, proposal: { schemaVersion: 2 } };
const proposalRaw = JSON.stringify(proposalBody);
const proposalIdem = "owner:test-proposal";
const ownerHeaders = {
  "x-apfel-intake-key-id": "owner",
  "x-apfel-intake-timestamp": timestamp,
  "x-apfel-intake-signature": signature({
    keyId: "owner", timestamp, requestPath: "/webhook/apfel-intake-v2-proposal", idem: proposalIdem,
    body: proposalRaw, secret: env.N8N_OWNER_HMAC_SECRET,
  }),
  "idempotency-key": proposalIdem,
};
const proposalForward = runCode("APF06PROPOSAL2", "Verify & Sign", { body: proposalBody, headers: ownerHeaders })[0].json;
assert.equal(proposalForward.appKey, "n8n-owner-v2");
assert.throws(() => runCode("APF06PROPOSAL2", "Verify & Sign", {
  body: proposalBody,
  headers: { ...ownerHeaders, "x-apfel-intake-key-id": "safi-bot" },
}), /owner submission required/);

const sensitiveBody = { ...startBody, payload: { imei: "490154203237518" } };
assert.throws(() => runCode("APF01INTAKEV2", "Verify Start", { body: sensitiveBody, headers: {} }), /sensitive identifier rejected/);

const assetBody = { runId, asset: { assetKey: "intake/test.webp" } };
const assetRaw = JSON.stringify(assetBody);
const assetIdem = "safi:test-asset";
const assetForward = runCode("APF05ASSETV2", "Verify & Sign", {
  body: assetBody,
  headers: {
    "x-apfel-intake-key-id": "safi-bot",
    "x-apfel-intake-timestamp": timestamp,
    "x-apfel-intake-signature": signature({ keyId: "safi-bot", timestamp, requestPath: "/webhook/apfel-intake-v2-asset", idem: assetIdem, body: assetRaw, secret: env.N8N_INTAKE_HMAC_SECRET }),
    "idempotency-key": assetIdem,
  },
})[0].json;
assert.equal(assetForward.appKey, "n8n-submit-v2");

console.log("n8n v2 generated workflow policy tests passed");
