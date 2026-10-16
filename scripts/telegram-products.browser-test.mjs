// Real React components with isolated synthetic API responses. No live admin,
// Telegram, provider credits, or production database are used.
import { createServer } from 'node:http';
import {
  mkdtemp,
  readFile,
  readdir,
  stat,
  writeFile,
  rm,
} from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/root/apfel-audit/browser/node_modules/playwright',
);
const root = process.cwd(),
  temp = await mkdtemp(path.join(tmpdir(), 'apfel-telegram-ui-'));
const output = process.env.TELEGRAM_QA_DIR || '/tmp/apfel-telegram-qa';
const { mkdir } = await import('node:fs/promises');
await mkdir(output, { recursive: true });
const cssFiles = async (directory) =>
  (
    await Promise.all(
      (await readdir(directory)).map(async (name) => {
        const file = path.join(directory, name);
        return (await stat(file)).isDirectory()
          ? cssFiles(file)
          : file.endsWith('.css')
            ? [file]
            : [];
      }),
    )
  ).flat();
const css = (
  await Promise.all(
    (await cssFiles(path.join(root, '.next/static'))).map((file) =>
      readFile(file, 'utf8'),
    ),
  )
).join('\n');
if (!css)
  throw new Error('Build the application before running the UI fixture');
await writeFile(
  path.join(temp, 'navigation.js'),
  `export const useRouter=()=>({refresh:()=>window.dispatchEvent(new Event('fixture-refresh'))});`,
);
await writeFile(
  path.join(temp, 'link.jsx'),
  `import React from 'react';export default function Link({children,prefetch,...props}){return <a {...props}>{children}</a>}`,
);
await writeFile(
  path.join(temp, 'image.jsx'),
  `import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}`,
);
await build({
  stdin: {
    contents: `import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';import Settings from './src/components/admin/TelegramBotSettings';import Submissions from './src/components/admin/TelegramProductSubmissions';
function App(){const[data,setData]=useState(null);const section=location.pathname.slice(1)||'members';useEffect(()=>{const load=()=>fetch('/fixture/data').then(r=>r.json()).then(setData);load();window.addEventListener('fixture-refresh',load);return()=>window.removeEventListener('fixture-refresh',load)},[]);if(!data)return <p>Loading…</p>;return <main className="min-h-screen bg-background text-foreground p-4 sm:p-8">{section==='submissions'?<Submissions locale="en" rows={data.rows} isOwner/>:<Settings locale="en" section={section} initialData={data.settings}/>}</main>};createRoot(document.getElementById('root')).render(<App/>);`,
    loader: 'tsx',
    resolveDir: root,
  },
  outfile: path.join(temp, 'app.js'),
  bundle: true,
  nodePaths: [path.join(root, 'node_modules')],
  format: 'iife',
  jsx: 'automatic',
  tsconfig: path.join(root, 'tsconfig.json'),
  alias: {
    'next/navigation': path.join(temp, 'navigation.js'),
    'next/link': path.join(temp, 'link.jsx'),
    'next/image': path.join(temp, 'image.jsx'),
  },
  logLevel: 'silent',
});
const settings = {
  botUsername: 'synthetic_apfel_bot',
  members: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      telegram_id: '123456789',
      display_name: 'Synthetic staff',
      locale: 'en',
      status: 'pending',
      last_seen_at: null,
    },
  ],
  credentials: {
    slots: [
      {
        slot: 'primary',
        label: 'Shop primary',
        fingerprint: 'abcd1234',
        validated_at: '2026-10-16',
      },
    ],
    activeSlot: 'primary',
    imageModel: 'gemini-nano-banana-2.1',
    encryptionConfigured: true,
    enabled: true,
  },
};
const rows = [
  {
    id: '00000000-0000-4000-8000-000000000002',
    draft_id: '00000000-0000-4000-8000-000000000003',
    status: 'submitted',
    display_name: 'Synthetic staff',
    telegram_id: '123456789',
    revision: 3,
    document: {
      shared: { title: 'Apple iPhone fixture' },
      entries: [
        {
          id: 'fixture-entry',
          color: 'Black',
          storage: '256 GB',
          configuration: { connectivity: 'Wi-Fi' },
          condition: 'new',
          price: 699,
          stock: 2,
        },
      ],
    },
    results: [],
    state: {
      sources: [
        {
          title: 'Official fixture',
          url: 'https://www.apple.com/',
          retrievedAt: '2026-10-16',
        },
      ],
      warnings: [],
    },
    assets: [],
    events: [
      {
        event_type: 'submitted',
        actor: 'telegram:123456789',
        created_at: '2026-10-16',
      },
    ],
    blockers: ['Confirm actual device photos.'],
    review_note: null,
  },
];
const mutations = [];
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  const url = new URL(request.url, 'http://localhost');
  if (request.method === 'POST') {
    let raw = '';
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    mutations.push({ url: url.pathname, body });
    if (body.action === 'approve') settings.members[0].status = 'active';
    if (body.action === 'revoke') settings.members[0].status = 'revoked';
    if (body.action === 'activate_key')
      settings.credentials.activeSlot = body.slot;
    if (body.action === 'save_key')
      settings.credentials.slots.push({
        slot: body.slot,
        label: body.label,
        fingerprint: 'new-fingerprint',
        validated_at: '2026-10-16',
      });
    if (body.action === 'changes') {
      rows[0].status = 'changes_requested';
      rows[0].review_note = body.note;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify(
        body.action === 'invite'
          ? { token: 'synthetic-one-time-invitation' }
          : { success: true },
      ),
    );
    return;
  }
  if (
    url.pathname === '/fixture/data' ||
    url.pathname === '/api/admin/telegram-products'
  ) {
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify(
        url.pathname === '/fixture/data' ? { settings, rows } : settings,
      ),
    );
    return;
  }
  if (url.pathname === '/app.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(await readFile(path.join(temp, 'app.js')));
    return;
  }
  response.setHeader('Content-Type', 'text/html');
  response.end(
    `<!doctype html><html lang="en" data-theme="dark"><head><title>Apfel Telegram admin QA</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>`,
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/members`);
    await page
      .getByRole('heading', { name: 'Telegram Bot', exact: true })
      .waitFor();
    if ((await page.title()) !== 'Apfel Telegram admin QA')
      throw new Error('Wrong page identity');
    await page
      .getByLabel('Confirm your admin password')
      .fill('synthetic-password');
    await page.getByLabel('Staff name / key label').fill('Synthetic staff');
    await page.getByRole('button', { name: 'Create staff invitation' }).click();
    await page
      .getByText(
        'https://t.me/synthetic_apfel_bot?start=synthetic-one-time-invitation',
        { exact: true },
      )
      .waitFor();
    if ((await page.locator('input[type=password]').inputValue()) !== '')
      throw new Error('Password retained after action');
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw new Error('Mobile overflow');
    await page.screenshot({
      path: path.join(output, `members-${viewport.width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByLabel('Confirm your admin password')
    .fill('synthetic-password');
  await page.getByRole('button', { name: 'Approve access' }).click();
  await page.getByText('Synthetic staff · Active', { exact: true }).waitFor();
  await page.goto(`${base}/providers`);
  await page.getByRole('heading', { name: 'AI Providers' }).waitFor();
  await page
    .getByLabel('Confirm your admin password')
    .fill('synthetic-password');
  await page
    .getByLabel('Active credential', { exact: true })
    .selectOption('backup');
  await page.getByLabel('Staff name / key label').fill('Backup fixture');
  await page
    .getByLabel('New API key')
    .fill('synthetic-provider-key-should-not-be-visible');
  await page.getByRole('button', { name: 'Validate & save' }).click();
  await page.getByText('Backup · Backup fixture', { exact: true }).waitFor();
  if ((await page.getByLabel('New API key').inputValue()) !== '')
    throw new Error('Key input retained');
  await page
    .getByLabel('Confirm your admin password')
    .fill('synthetic-password');
  await page
    .getByRole('article')
    .filter({ hasText: 'Backup fixture' })
    .getByRole('button', { name: 'Use this credential' })
    .click();
  await page.locator('strong').filter({ hasText: 'backup' }).waitFor();
  await page.screenshot({
    path: path.join(output, 'providers-mobile.png'),
    fullPage: true,
  });
  await page.goto(`${base}/submissions`);
  await page
    .getByRole('heading', { name: 'Telegram submissions', exact: true })
    .waitFor();
  await page.getByText('Missing information (1)', { exact: true }).click();
  await page
    .getByText('Confirm actual device photos.', { exact: true })
    .waitFor();
  await page
    .getByLabel('Reason / instructions for staff')
    .fill('Please upload an actual device photo.');
  await page
    .getByRole('button', { name: 'Request changes', exact: true })
    .click();
  await page
    .getByText('Please upload an actual device photo.', { exact: true })
    .waitFor();
  if (
    !mutations.some((m) => m.body.action === 'changes' && m.body.revision === 3)
  )
    throw new Error('Review did not bind current draft revision');
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error('Submission overflow');
  await page.screenshot({
    path: path.join(output, 'submissions-mobile.png'),
    fullPage: true,
  });
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log(
    JSON.stringify({
      passed: true,
      url: base,
      viewports: [1280, 375],
      mutations: mutations.map((m) => m.body.action),
      consoleErrors: errors,
      screenshots: output,
    }),
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(temp, { recursive: true, force: true });
}
