#!/usr/bin/env bash
set -euo pipefail
export PATH=/root/.nvm/versions/node/v24.14.0/bin:$PATH
cd "$(dirname "$0")/.."
npm run typecheck
npm run lint
npm test -- --reporter=dot
npm run audit:unused
npm audit --audit-level=high
set -a
. /srv/apfel-park/app/shared/app.env
set +a
node_modules/.bin/tsx scripts/integration/operations-db.ts
node_modules/.bin/tsx scripts/integration/operations-production-rehearsal.ts
npm run build
npm run test:image-uploads
printf 'OPERATIONS_PILOT_VERIFICATION_PASSED\n'
