# Security prerequisite discovered by deployment

The first deployment of SEO commit 634fc76ae8fafdb4a767990cb6cc664e6e3e3494 stopped before activation at npm audit. Live remained e44a04a5eec2dc6dab8088d53b34d841c48396d8.

The existing lockfile exposed Next.js 16.3.3 (critical ImageResponse RCE, GHSA-vcvr-r3jv-pc5j) and brace-expansion 1.1.18/5.0.9 (high DoS advisories). No security gate was bypassed.

Separate prerequisite commit upgrades next and matching eslint-config-next from 16.3.3 to 16.3.8 and refreshes their companion Next packages plus brace-expansion to patched 1.1.21/5.0.12. No added/removed packages, major/minor upgrade, application configuration, DB change or payment code change. Registry versions verified before installation.

RED: canonical deployment's actual security gate failed (log: /root/.hermes/cache/scratch/apfel-deploy.log; machine-readable baseline: apfel-audit-security-before.json). GREEN: npm audit reports zero vulnerabilities; full tests, lint, typecheck, unused-source audit and build passed against patched dependencies. Canonical deployment must rerun all gates and runtime regression checks before activation.
