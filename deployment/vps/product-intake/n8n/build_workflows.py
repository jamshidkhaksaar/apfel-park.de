from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "generated"


def node(name: str, kind: str, parameters: dict, position: tuple[int, int], version: float = 2) -> dict:
    return {
        "parameters": parameters,
        "id": name.lower().replace(" ", "-")[:36],
        "name": name,
        "type": kind,
        "typeVersion": version,
        "position": list(position),
    }


def connection(*names: str) -> dict:
    result: dict = {}
    for left, right in zip(names, names[1:]):
        result[left] = {"main": [[{"node": right, "type": "main", "index": 0}]]}
    return result


VERIFY_START = r"""
const crypto = require('crypto');
const body = $json.body || {};
const headers = $json.headers || {};
const raw = JSON.stringify(body);
if (/\"(?:imei|eid|serial(?:[_-]?number)?|serien(?:[_ -]?(?:nummer|nr))?)\"\s*:/i.test(raw) || /(?:imei|eid|serial|serien\s*(?:nummer|nr))\s*[:=#-]?\s*[a-z0-9 -]{6,}/i.test(raw) || /(^|\D)\d{15}(\D|$)/.test(raw) || /(^|\D)\d{32}(\D|$)/.test(raw)) throw new Error('sensitive identifier rejected');
const keyId = String(headers['x-apfel-intake-key-id'] || '');
const timestamp = String(headers['x-apfel-intake-timestamp'] || '');
const signature = String(headers['x-apfel-intake-signature'] || '').replace(/^sha256=/, '');
const idem = String(headers['idempotency-key'] || '');
const ownerKey = $env.N8N_OWNER_KEY_ID || 'owner';
const safiKey = $env.N8N_SAFI_KEY_ID || 'safi-bot';
if (keyId !== ownerKey && keyId !== safiKey) throw new Error('unknown intake key');
const now = Math.floor(Date.now() / 1000);
if (!/^\d{10}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300) throw new Error('stale intake signature');
if (!idem || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/.test(idem)) throw new Error('invalid idempotency key');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const canonical = ['APFEL-PRODUCT-INTAKE-V1', keyId, timestamp, 'POST', '/webhook/apfel-intake-v2', idem, hash(raw)].join('\n');
const incomingSecret = keyId === ownerKey ? $env.N8N_OWNER_HMAC_SECRET : $env.N8N_INTAKE_HMAC_SECRET;
const expected = crypto.createHmac('sha256', incomingSecret).update(canonical).digest('hex');
if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid intake signature');
const { target: _notificationTarget, ...safeBody } = body;
const appBody = { ...safeBody, submittedBy: keyId, submittedByRole: keyId === ownerKey ? 'owner' : 'safi' };
const appRaw = JSON.stringify(appBody);
const appTime = String(Math.floor(Date.now() / 1000));
const appKey = $env.PRODUCT_INTAKE_SUBMIT_KEY_ID || 'n8n-submit-v2';
const appCanonical = ['APFEL-PRODUCT-INTAKE-V1', appKey, appTime, 'POST', '/api/integrations/product-intake/runs', idem, hash(appRaw)].join('\n');
const appSignature = crypto.createHmac('sha256', $env.PRODUCT_INTAKE_SUBMIT_SECRET).update(appCanonical).digest('hex');
return [{ json: { appBody, appRaw, appTime, appKey, appSignature, idem, target: body.target || 'telegram' } }];
""".strip()

VERIFY_DECISION = r"""
const crypto = require('crypto');
const body = $json.body || {};
const headers = $json.headers || {};
const raw = JSON.stringify(body);
if (/\"(?:imei|eid|serial(?:[_-]?number)?|serien(?:[_ -]?(?:nummer|nr))?)\"\s*:/i.test(raw) || /(?:imei|eid|serial|serien\s*(?:nummer|nr))\s*[:=#-]?\s*[a-z0-9 -]{6,}/i.test(raw) || /(^|\D)\d{15}(\D|$)/.test(raw) || /(^|\D)\d{32}(\D|$)/.test(raw)) throw new Error('sensitive identifier rejected');
const keyId = String(headers['x-apfel-intake-key-id'] || '');
const timestamp = String(headers['x-apfel-intake-timestamp'] || '');
const signature = String(headers['x-apfel-intake-signature'] || '').replace(/^sha256=/, '');
const idem = String(headers['idempotency-key'] || '');
if (keyId !== ($env.N8N_OWNER_KEY_ID || 'owner')) throw new Error('owner approval required');
const now = Math.floor(Date.now() / 1000);
if (!/^\d{10}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300) throw new Error('stale decision signature');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const incoming = ['APFEL-PRODUCT-INTAKE-V1', keyId, timestamp, 'POST', '/webhook/apfel-intake-v2-decision', idem, hash(raw)].join('\n');
const expected = crypto.createHmac('sha256', $env.N8N_OWNER_HMAC_SECRET).update(incoming).digest('hex');
if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid decision signature');
if (!/^(?:[0-9a-f-]{36}|APF-[A-Z0-9]{4,12})$/i.test(String(body.runId || ''))) throw new Error('invalid run reference');
const appBody = { decision: body.decision, stage: body.stage || null, actorId: body.actorId || null, proposalHash: body.proposalHash, reason: body.reason || null };
const appRaw = JSON.stringify(appBody);
const appTime = String(Math.floor(Date.now() / 1000));
const appKey = $env.PRODUCT_INTAKE_OWNER_KEY_ID || 'n8n-owner-v2';
const path = `/api/integrations/product-intake/runs/${body.runId}/decision`;
const canonical = ['APFEL-PRODUCT-INTAKE-V1', appKey, appTime, 'POST', path, idem, hash(appRaw)].join('\n');
const appSignature = crypto.createHmac('sha256', $env.PRODUCT_INTAKE_OWNER_SECRET).update(canonical).digest('hex');
return [{ json: { appBody, appRaw, appTime, appKey, appSignature, idem, path, target: body.target || 'telegram' } }];
""".strip()

VERIFY_RUN_LOOKUP = r"""
const crypto = require('crypto');
const body = $json.body || {};
const headers = $json.headers || {};
const raw = JSON.stringify(body);
if (/\"(?:imei|eid|serial(?:[_-]?number)?|serien(?:[_ -]?(?:nummer|nr))?)\"\s*:/i.test(raw) || /(?:imei|eid|serial|serien\s*(?:nummer|nr))\s*[:=#-]?\s*[a-z0-9 -]{6,}/i.test(raw) || /(^|\D)\d{15}(\D|$)/.test(raw) || /(^|\D)\d{32}(\D|$)/.test(raw)) throw new Error('sensitive identifier rejected');
const keyId = String(headers['x-apfel-intake-key-id'] || '');
const timestamp = String(headers['x-apfel-intake-timestamp'] || '');
const signature = String(headers['x-apfel-intake-signature'] || '').replace(/^sha256=/, '');
const idem = String(headers['idempotency-key'] || '');
if (keyId !== ($env.N8N_OWNER_KEY_ID || 'owner')) throw new Error('owner lookup required');
if (!/^(?:[0-9a-f-]{36}|APF-[A-Z0-9]{4,12})$/i.test(String(body.runId || ''))) throw new Error('invalid run reference');
const now = Math.floor(Date.now() / 1000);
if (!/^\d{10}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300) throw new Error('stale lookup signature');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const incoming = ['APFEL-PRODUCT-INTAKE-V1', keyId, timestamp, 'POST', '/webhook/apfel-intake-v2-run', idem, hash(raw)].join('\n');
const expected = crypto.createHmac('sha256', $env.N8N_OWNER_HMAC_SECRET).update(incoming).digest('hex');
if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid lookup signature');
const appTime = String(Math.floor(Date.now() / 1000));
const appKey = $env.PRODUCT_INTAKE_OWNER_KEY_ID || 'n8n-owner-v2';
const path = `/api/integrations/product-intake/runs/${body.runId}`;
const canonical = ['APFEL-PRODUCT-INTAKE-V1', appKey, appTime, 'GET', path, '', hash('')].join('\n');
const appSignature = crypto.createHmac('sha256', $env.PRODUCT_INTAKE_OWNER_SECRET).update(canonical).digest('hex');
return [{ json: { appTime, appKey, appSignature, path } }];
""".strip()

VERIFY_RESEARCH = r"""
const crypto = require('crypto');
const body = $json.body || {};
const headers = $json.headers || {};
const raw = JSON.stringify(body);
const keyId = String(headers['x-apfel-intake-key-id'] || '');
const timestamp = String(headers['x-apfel-intake-timestamp'] || '');
const signature = String(headers['x-apfel-intake-signature'] || '').replace(/^sha256=/, '');
const idem = String(headers['idempotency-key'] || '');
if (keyId !== ($env.N8N_OWNER_KEY_ID || 'owner')) throw new Error('owner research required');
if (!/^\d{10}$/.test(timestamp) || Math.abs(Math.floor(Date.now()/1000)-Number(timestamp))>300) throw new Error('stale research signature');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const canonical=['APFEL-PRODUCT-INTAKE-V1',keyId,timestamp,'POST','/webhook/apfel-intake-v2-research',idem,hash(raw)].join('\n');
const expected=crypto.createHmac('sha256',$env.N8N_OWNER_HMAC_SECRET).update(canonical).digest('hex');
if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) throw new Error('invalid research signature');
const allowed=['apple.com','asus.com','google.com','honor.com','huawei.com','lenovo.com','mi.com','motorola.com','motorola.de','nokia.com','oneplus.com','oppo.com','realme.com','samsung.com','samsungmobilepress.com','sony.com','sony.de','eprel.ec.europa.eu','gs1.org','apfel-park.de',...String($env.PRODUCT_INTAKE_ALLOWED_SOURCE_DOMAINS||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean)];
if(!Array.isArray(body.sources)||body.sources.length===0) throw new Error('official sources required');
for(const source of body.sources){const host=new URL(source.url).hostname.toLowerCase();if(!allowed.some(domain=>host===domain||host.endsWith('.'+domain))) throw new Error('non-official source: '+host);}
return [{json:{success:true,sources:body.sources,checkedAt:new Date().toISOString()}}];
""".strip()


def forward_code(webhook_path: str, app_suffix: str, body_field: str, owner_only: bool = False) -> str:
    owner_guard = "if (keyId !== ($env.N8N_OWNER_KEY_ID || 'owner')) throw new Error('owner submission required');" if owner_only else ""
    app_key = "$env.PRODUCT_INTAKE_OWNER_KEY_ID || 'n8n-owner-v2'" if owner_only else "$env.PRODUCT_INTAKE_SUBMIT_KEY_ID || 'n8n-submit-v2'"
    app_secret = "$env.PRODUCT_INTAKE_OWNER_SECRET" if owner_only else "$env.PRODUCT_INTAKE_SUBMIT_SECRET"
    return rf"""
const crypto = require('crypto');
const body = $json.body || {{}};
const headers = $json.headers || {{}};
const raw = JSON.stringify(body);
if (/\"(?:imei|eid|serial(?:[_-]?number)?|serien(?:[_ -]?(?:nummer|nr))?)\"\s*:/i.test(raw) || /(?:imei|eid|serial|serien\s*(?:nummer|nr))\s*[:=#-]?\s*[a-z0-9 -]{{6,}}/i.test(raw) || /(^|\D)\d{{15}}(\D|$)/.test(raw) || /(^|\D)\d{{32}}(\D|$)/.test(raw)) throw new Error('sensitive identifier rejected');
const keyId = String(headers['x-apfel-intake-key-id'] || '');
const timestamp = String(headers['x-apfel-intake-timestamp'] || '');
const signature = String(headers['x-apfel-intake-signature'] || '').replace(/^sha256=/, '');
const idem = String(headers['idempotency-key'] || '');
const ownerKey = $env.N8N_OWNER_KEY_ID || 'owner';
const safiKey = $env.N8N_SAFI_KEY_ID || 'safi-bot';
if (keyId !== ownerKey && keyId !== safiKey) throw new Error('unknown intake key');
{owner_guard}
if (!/^(?:[0-9a-f-]{{36}}|APF-[A-Z0-9]{{4,12}})$/i.test(String(body.runId || ''))) throw new Error('invalid run reference');
if (body.assetId !== undefined && !/^[0-9a-f-]{{36}}$/i.test(String(body.assetId))) throw new Error('invalid asset id');
const now = Math.floor(Date.now() / 1000);
if (!/^\d{{10}}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300) throw new Error('stale signature');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const incoming = ['APFEL-PRODUCT-INTAKE-V1', keyId, timestamp, 'POST', '{webhook_path}', idem, hash(raw)].join('\n');
const incomingSecret = keyId === ownerKey ? $env.N8N_OWNER_HMAC_SECRET : $env.N8N_INTAKE_HMAC_SECRET;
const expected = crypto.createHmac('sha256', incomingSecret).update(incoming).digest('hex');
if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid signature');
const appBody = body.{body_field};
if (!appBody || typeof appBody !== 'object') throw new Error('missing {body_field}');
const appRaw = JSON.stringify(appBody);
const appTime = String(Math.floor(Date.now() / 1000));
const appKey = {app_key};
const path = `/api/integrations/product-intake/runs/${{body.runId}}/{app_suffix}`;
const canonical = ['APFEL-PRODUCT-INTAKE-V1', appKey, appTime, 'POST', path, idem, hash(appRaw)].join('\n');
const appSignature = crypto.createHmac('sha256', {app_secret}).update(canonical).digest('hex');
return [{{ json: {{ appBody, appRaw, appTime, appKey, appSignature, idem, path }} }}];
""".strip()


def http_to_app(name: str, url: str) -> dict:
    return node(name, "n8n-nodes-base.httpRequest", {
        "method": "POST",
        "url": url,
        "sendHeaders": True,
        "headerParameters": {"parameters": [
            {"name": "X-Apfel-Intake-Key-Id", "value": "={{ $json.appKey }}"},
            {"name": "X-Apfel-Intake-Timestamp", "value": "={{ $json.appTime }}"},
            {"name": "X-Apfel-Intake-Signature", "value": "={{ $json.appSignature }}"},
            {"name": "Idempotency-Key", "value": "={{ $json.idem }}"},
            {"name": "Content-Type", "value": "application/json"},
        ]},
        "sendBody": True,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ $json.appRaw }}",
        "options": {"timeout": 60000},
    }, (520, 300), 4.2)


def webhook_workflows() -> list[dict]:
    start_nodes = [
        node("Intake Webhook", "n8n-nodes-base.webhook", {"httpMethod": "POST", "path": "apfel-intake-v2", "responseMode": "responseNode", "options": {}}, (0, 300), 2),
        node("Verify Start", "n8n-nodes-base.code", {"mode": "runOnceForAllItems", "jsCode": VERIFY_START}, (260, 300)),
        http_to_app("Create Intake Run", "={{ ($env.APFEL_STORE_URL || 'https://apfel-park.de') + '/api/integrations/product-intake/runs' }}"),
        node("Respond", "n8n-nodes-base.respondToWebhook", {"respondWith": "json", "responseBody": "={{ JSON.stringify({ success: true, runId: $('Create Intake Run').first().json.run?.id, intakeCode: $('Create Intake Run').first().json.run?.intakeCode, status: $('Create Intake Run').first().json.run?.status, shadowMode: $('Create Intake Run').first().json.run?.mode !== 'live' }) }}", "options": {}}, (780, 300), 1.4),
    ]
    start_connections = connection("Intake Webhook", "Verify Start", "Create Intake Run")
    start_connections["Create Intake Run"] = {"main": [[{"node": "Respond", "type": "main", "index": 0}]]}
    start = {"id": "APF01INTAKEV2", "name": "APF-01 Intake Router v2 (Shadow)", "active": False, "nodes": start_nodes,
             "connections": start_connections, "settings": {"executionOrder": "v1", "saveExecutionProgress": False, "saveDataErrorExecution": "none", "saveDataSuccessExecution": "none", "errorWorkflow": "APF99ERRORV2"}}

    decision_nodes = [
        node("Decision Webhook", "n8n-nodes-base.webhook", {"httpMethod": "POST", "path": "apfel-intake-v2-decision", "responseMode": "responseNode", "options": {}}, (0, 300), 2),
        node("Verify Decision", "n8n-nodes-base.code", {"mode": "runOnceForAllItems", "jsCode": VERIFY_DECISION}, (260, 300)),
        http_to_app("Record Decision", "={{ ($env.APFEL_STORE_URL || 'https://apfel-park.de') + $json.path }}"),
        node("Decision Response", "n8n-nodes-base.respondToWebhook", {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}}, (780, 300), 1.4),
    ]
    decision = {"id": "APF07DECISION2", "name": "APF-07 Decision & Apply v2 (Shadow)", "active": False, "nodes": decision_nodes,
                "connections": connection("Decision Webhook", "Verify Decision", "Record Decision", "Decision Response"), "settings": {"executionOrder": "v1", "saveExecutionProgress": False, "saveDataErrorExecution": "none", "saveDataSuccessExecution": "none", "errorWorkflow": "APF99ERRORV2"}}
    return [start, decision]


def run_lookup_workflow() -> dict:
    nodes = [
        node("Run Lookup Webhook", "n8n-nodes-base.webhook", {"httpMethod": "POST", "path": "apfel-intake-v2-run", "responseMode": "responseNode", "options": {}}, (0, 300), 2),
        node("Verify Lookup", "n8n-nodes-base.code", {"mode": "runOnceForAllItems", "jsCode": VERIFY_RUN_LOOKUP}, (260, 300)),
        node("Read Intake Run", "n8n-nodes-base.httpRequest", {
            "method": "GET",
            "url": "={{ ($env.APFEL_STORE_URL || 'https://apfel-park.de') + $json.path }}",
            "sendHeaders": True,
            "headerParameters": {"parameters": [
                {"name": "X-Apfel-Intake-Key-Id", "value": "={{ $json.appKey }}"},
                {"name": "X-Apfel-Intake-Timestamp", "value": "={{ $json.appTime }}"},
                {"name": "X-Apfel-Intake-Signature", "value": "={{ $json.appSignature }}"},
            ]},
            "options": {"timeout": 60000},
        }, (520, 300), 4.2),
        node("Lookup Response", "n8n-nodes-base.respondToWebhook", {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}}, (780, 300), 1.4),
    ]
    return {
        "id": "APF03RESOLVEV2",
        "name": "APF-03 Product Resolver v2",
        "active": False,
        "nodes": nodes,
        "connections": connection("Run Lookup Webhook", "Verify Lookup", "Read Intake Run", "Lookup Response"),
        "settings": {"executionOrder": "v1", "saveExecutionProgress": False, "saveDataErrorExecution": "none", "saveDataSuccessExecution": "none", "errorWorkflow": "APF99ERRORV2"},
    }


def research_workflow() -> dict:
    nodes = [
        node("Research Webhook", "n8n-nodes-base.webhook", {"httpMethod": "POST", "path": "apfel-intake-v2-research", "responseMode": "responseNode", "options": {}}, (0, 300), 2),
        node("Verify Official Sources", "n8n-nodes-base.code", {"mode": "runOnceForAllItems", "jsCode": VERIFY_RESEARCH}, (260, 300)),
        node("Research Response", "n8n-nodes-base.respondToWebhook", {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}}, (520, 300), 1.4),
    ]
    return {
        "id": "APF04RESEARCH2", "name": "APF-04 Official Research v2", "active": False,
        "nodes": nodes, "connections": connection("Research Webhook", "Verify Official Sources", "Research Response"),
        "settings": {"executionOrder": "v1", "saveExecutionProgress": False, "saveDataErrorExecution": "none", "saveDataSuccessExecution": "none", "errorWorkflow": "APF99ERRORV2"},
    }


def forward_workflow(
    identifier: str,
    name: str,
    webhook_name: str,
    webhook_path: str,
    app_suffix: str,
    body_field: str,
    owner_only: bool = False,
) -> dict:
    nodes = [
        node(webhook_name, "n8n-nodes-base.webhook", {"httpMethod": "POST", "path": webhook_path.removeprefix("/webhook/"), "responseMode": "responseNode", "options": {}}, (0, 300), 2),
        node("Verify & Sign", "n8n-nodes-base.code", {"mode": "runOnceForAllItems", "jsCode": forward_code(webhook_path, app_suffix, body_field, owner_only)}, (260, 300)),
        http_to_app("Forward to App", "={{ ($env.APFEL_STORE_URL || 'https://apfel-park.de') + $json.path }}"),
        node("Response", "n8n-nodes-base.respondToWebhook", {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}}, (780, 300), 1.4),
    ]
    return {"id": identifier, "name": name, "active": False, "nodes": nodes,
            "connections": connection(webhook_name, "Verify & Sign", "Forward to App", "Response"), "settings": {"executionOrder": "v1", "saveExecutionProgress": False, "saveDataErrorExecution": "none", "saveDataSuccessExecution": "none", "errorWorkflow": "APF99ERRORV2"}}


def utility_workflow(identifier: str, name: str, code: str) -> dict:
    trigger = node("When Called", "n8n-nodes-base.executeWorkflowTrigger", {"inputSource": "passthrough"}, (0, 300), 1.1)
    validate = node("Validate", "n8n-nodes-base.code", {"mode": "runOnceForAllItems", "jsCode": code}, (260, 300))
    return {"id": identifier, "name": name, "active": False, "nodes": [trigger, validate], "connections": connection("When Called", "Validate"), "settings": {"executionOrder": "v1", "saveExecutionProgress": False, "saveDataErrorExecution": "none", "saveDataSuccessExecution": "none", "errorWorkflow": "APF99ERRORV2"}}


def all_workflows() -> list[dict]:
    passthrough = "return $input.all();"
    error_nodes = [
        node("Workflow Error", "n8n-nodes-base.errorTrigger", {}, (0, 300), 1),
        node("Notify Failure", "n8n-nodes-base.httpRequest", {
            "method": "POST", "url": "={{ $env.NOTIFY_BRIDGE_URL }}", "sendHeaders": True,
            "headerParameters": {"parameters": [{"name": "X-Bridge-Token", "value": "={{ $env.NOTIFY_BRIDGE_TOKEN }}"}, {"name": "Content-Type", "value": "application/json"}]},
            "sendBody": True, "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({ target: 'telegram', subject: '❌ Product intake v2 failed', text: `Workflow: ${$json.workflow?.name || '?'}\\nExecution: ${$json.execution?.id || '?'}\\nCheck the application audit before retrying; this notification does not infer mutation state.` }) }}",
            "options": {"timeout": 60000},
        }, (260, 300), 4.2),
    ]
    error = {"id": "APF99ERRORV2", "name": "APF-99 Error Handler v2", "active": False, "nodes": error_nodes, "connections": connection("Workflow Error", "Notify Failure"), "settings": {"executionOrder": "v1", "saveExecutionProgress": False, "saveDataErrorExecution": "none", "saveDataSuccessExecution": "none"}}
    return webhook_workflows() + [
        forward_workflow(
            "APF02VISIONV2",
            "APF-02 Vision Result Validator v2",
            "Vision Analysis Webhook",
            "/webhook/apfel-intake-v2-analysis",
            "assets/${body.assetId}/analysis",
            "analysis",
            owner_only=True,
        ),
        run_lookup_workflow(),
        research_workflow(),
        forward_workflow("APF05ASSETV2", "APF-05 Asset Processor v2", "Asset Webhook", "/webhook/apfel-intake-v2-asset", "assets", "asset"),
        forward_workflow(
            "APF06PROPOSAL2",
            "APF-06 Proposal Builder v2",
            "Proposal Webhook",
            "/webhook/apfel-intake-v2-proposal",
            "proposal",
            "proposal",
            owner_only=True,
        ),
        error,
    ]


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for workflow in all_workflows():
        path = OUT / f"{workflow['id']}.json"
        path.write_text(json.dumps(workflow, ensure_ascii=False, indent=2) + "\n")
        print(path)
