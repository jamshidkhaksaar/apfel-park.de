// Core of the unused-source audit, split out from the CLI so a test can run it
// against a fixture tree. scripts/audit-unused-source.mjs keeps the printing and
// the exit code; this module owns the reachability graph.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// One normalized key for every comparison. path.relative() returns backslashes
// on Windows while TypeScript resolves modules with forward slashes. Comparing
// the two directly made every entry point look unreachable on Windows, so the
// whole src tree was reported as dead -- a fix that only made the audit quiet
// would be worse than the bug, because nothing would be flagged ever again.
const fileKey = (file) => file.split(path.sep).join('/');

// The audit can only report dead files if it actually resolved imports. When it
// resolves almost none, every file looks like a candidate (loud) or -- if the
// entry detection is too broad at the same time -- nothing does (silent). These
// floors make that state an error instead of a pass.
export const auditHealthProblems = ({ checked, edges, minChecked, minEdges }) => {
  const problems = [];
  if (checked < minChecked) {
    problems.push(`only ${checked} source/script files were found, floor is ${minChecked}: the walk is likely looking at the wrong tree`);
  }
  if (edges < minEdges) {
    problems.push(`only ${edges} internal imports resolved, floor is ${minEdges}: module resolution is likely broken, so "nothing is unreachable" means only that nothing was followed`);
  }
  return problems;
};

export const auditUnusedSource = ({ root }) => {
  const relativeTo = (file) => fileKey(path.relative(root, file));

  // A tree without scripts/ (or src/) is audited, not crashed on.
  const walk = (directory) => (fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }) : []).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
  });
  const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'scripts'))];
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const fileSet = new Set(files.map(fileKey));
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
        if (specifier && !ts.isStringLiteral(specifier)) computedImports.push(relativeTo(file));
      }
      if (specifier && ts.isStringLiteral(specifier)) {
        const resolved = ts.resolveModuleName(specifier.text, file, options, ts.sys).resolvedModule?.resolvedFileName;
        if (resolved && fileSet.has(fileKey(resolved))) dependencies.push(fileKey(resolved));
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    graph.set(fileKey(file), dependencies);
  }

  const isEntry = (key) =>
    key.startsWith('scripts/') || /__tests__|\.(test|spec)\./.test(key)
    || /^src\/(proxy|middleware|instrumentation|instrumentation-client)\./.test(key)
    || (key.startsWith('src/app/') && /\/(page|route|layout|template|loading|error|not-found|global-error|default|sitemap|robots|manifest|icon|apple-icon|opengraph-image|twitter-image)\.[jt]sx?$/.test(key));

  const entryKeys = files.filter((file) => isEntry(relativeTo(file))).map(fileKey);
  const visited = new Set();
  const visit = (key) => {
    if (visited.has(key)) return;
    visited.add(key);
    for (const dependency of graph.get(key) ?? []) visit(dependency);
  };
  entryKeys.forEach(visit);

  const candidates = files.filter((file) => relativeTo(file).startsWith('src/')
    && !file.endsWith('.d.ts') && !visited.has(fileKey(file)));
  const edges = [...graph.values()].reduce((total, dependencies) => total + dependencies.length, 0);

  return {
    checked: files.length,
    entries: entryKeys.length,
    edges,
    candidates: candidates.map(relativeTo),
    computedImports: [...new Set(computedImports)],
  };
};
