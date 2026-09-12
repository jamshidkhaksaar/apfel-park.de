// Conservative source-file reachability audit. Review candidates before deleting:
// framework routes, operational scripts and tests are entry points, not dead files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(file) : /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
});
const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'scripts'))];
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const fileSet = new Set(files);
const graph = new Map();
const computedImports = [];

for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const dependencies = [];
  const visit = (node) => {
    let specifier;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      specifier = node.moduleSpecifier;
    } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
      || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      specifier = node.arguments[0];
      if (specifier && !ts.isStringLiteral(specifier)) computedImports.push(path.relative(root, file));
    }
    if (specifier && ts.isStringLiteral(specifier)) {
      const resolved = ts.resolveModuleName(specifier.text, file, options, ts.sys).resolvedModule?.resolvedFileName;
      if (resolved && fileSet.has(resolved)) dependencies.push(resolved);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  graph.set(file, dependencies);
}

const isEntry = (file) => {
  const relative = path.relative(root, file);
  return relative.startsWith('scripts/') || /__tests__|\.(test|spec)\./.test(relative)
    || /^src\/(proxy|middleware|instrumentation|instrumentation-client)\./.test(relative)
    || (relative.startsWith('src/app/') && /\/(page|route|layout|template|loading|error|not-found|global-error|default|sitemap|robots|manifest|icon|apple-icon|opengraph-image|twitter-image)\.[jt]sx?$/.test(relative));
};
const visited = new Set();
const visit = (file) => {
  if (visited.has(file)) return;
  visited.add(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency);
};
files.filter(isEntry).forEach(visit);
const candidates = files.filter((file) => file.startsWith(path.join(root, 'src') + path.sep)
  && !file.endsWith('.d.ts') && !visited.has(file));
console.log(`${files.length} source/script files checked; ${candidates.length} unreachable source-file candidates.`);
for (const file of candidates) console.log(`  REVIEW ${path.relative(root, file)}`);
if (computedImports.length) console.log(`Computed module loading requires manual review in: ${[...new Set(computedImports)].join(', ')}`);
console.log('This audit does not classify HTTP endpoints, public assets, CSS, or individual exports as unused.');
process.exitCode = candidates.length ? 1 : 0;
