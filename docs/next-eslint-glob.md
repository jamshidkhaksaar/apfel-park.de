# Next ESLint glob override

Next 16.3.8's ESLint plugin uses `fast-glob` only for resolving the optional
`settings.next.rootDir`. Its dependency tree includes unpatched `braces`
(GHSA-vfj7-8cjw-p6xm). The scoped npm override replaces that dependency with
`tinyglobby` 0.2.17; no runtime package or lint rule is removed.

This application does not configure `rootDir`, so Next uses the ESLint working
directory directly. Regression tests also cover optional directory glob strings
and arrays. If a future monorepo config introduces literal directory patterns,
check them carefully: tinyglobby expands literal directories recursively, unlike
fast-glob. Glob patterns and relative result paths are supported by the plugin.

Remove the override after an upstream Next release removes or fixes the affected
dependency, and rerun a clean install, lint, tests, and npm audit.
