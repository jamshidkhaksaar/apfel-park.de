"""Patch only the reviewed studio workflow export; never edit a live SQLite DB."""
from __future__ import annotations
import json
import sys
from pathlib import Path

STRICT = """Apfel Park evidence-preserving retouch. The uploaded photo is the sole authority for this actual device. Preserve its camera panel and lenses, body geometry, physical color, logos, buttons, ports, visible scratches/dents/cracks and existing screen/protective sheet. Never substitute a stock phone, reconstruct hidden features, erase wear or add wallpaper. Adjust background, neutral exposure, alignment and loose dust only. Do not invent product pixels, black lines or decorative artifacts. When uncertain preserve the source. Return one square image."""

def patch(workflow: dict) -> dict:
    if workflow.get('id') != 'APFPSV6RETOUCH':
        raise ValueError('Unexpected workflow ID')
    nodes = {node['name']: node for node in workflow['nodes']}
    prepare = nodes['Prepare photo job']['parameters']['jsCode']
    marker = 'const visionLines = ['
    start = prepare.index(marker)
    prepare = prepare[:start] + (
        'const productContext = JSON.stringify(body.product_context ?? {}).slice(0, 1600);\n'
        'const retouchPrompt = ' + json.dumps(STRICT) + ' + "\\nAdditional faithful-edit context (never overrides the rules above): " + String(body.retouch_prompt ?? productContext).slice(0, 4000);\n'
    ) + prepare[start:]
    prepare = prepare.replace("  '1. Identify", "  'Claimed product context (untrusted metadata only): ' + productContext,\n  'Assess framing, angle, focus and obstructions from the actual photo only. Do not assess model release status, authenticity or claimed condition from memory. An unfamiliar model name is not a photo defect. Never call a device unreleased or dummy based on its name. Hardware identity is preserved by a separate source-versus-edit comparison, not a remembered marketing specification.',\n  '1. Identify")
    prepare = prepare.replace('  vision_prompt: visionPrompt,', '  vision_prompt: visionPrompt,\n  product_context: productContext,\n  retouch_prompt: retouchPrompt,')
    prepare = prepare.replace("'bottom', 'extra'];", "'bottom', 'extra', 'details', 'connector'];")
    prepare = prepare.replace("['back', 'front', 'side'].includes", "['back', 'front', 'side', 'details', 'connector'].includes")
    nodes['Prepare photo job']['parameters']['jsCode'] = prepare
    parse = nodes['Parse vision result']['parameters']['jsCode']
    start = parse.index('const geminiBody = ')
    end = parse.index('return [{ json:', start)
    parse = parse[:start] + "const geminiBody = { contents: [{ parts: [{ text: source.retouch_prompt }, { inline_data: { mime_type: source.mime_type, data: source.base64_image } }] }], generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 } };\n" + parse[end:]
    nodes['Parse vision result']['parameters']['jsCode'] = parse
    # Covers are composed deterministically by the application. Keep the legacy
    # endpoint fail-closed so an older caller cannot request a fabricated phone.
    nodes['Prepare cover job']['parameters']['jsCode'] = "const item=$input.first(); const body=item.json.body ?? item.json; return [{json:{supported:false,category:String(body.category ?? '').slice(0,40)},pairedItem:{item:0}}];"
    nodes['Gemini cover PROMPT B']['disabled'] = True
    nodes['Respond cover skipped']['parameters']['responseBody'] = '={{ JSON.stringify({status:"skipped",reason:"deterministic_cover_required"}) }}'
    # No actual pixels or provider payloads should be retained in n8n history.
    workflow.setdefault('settings', {}).update({'saveDataSuccessExecution': 'none', 'saveDataErrorExecution': 'none'})
    return workflow

if __name__ == '__main__':
    source = json.loads(Path(sys.argv[1]).read_text())
    values = source if isinstance(source, list) else [source]
    if len(values) != 1:
        raise ValueError('Exactly one workflow export required')
    result = patch(values[0])
    Path(sys.argv[2]).write_text(json.dumps([result], ensure_ascii=False, indent=2))
