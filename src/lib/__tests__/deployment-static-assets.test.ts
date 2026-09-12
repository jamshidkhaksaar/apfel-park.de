import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const deployScriptPath = path.join(
  process.cwd(),
  "deployment/vps/scripts/deploy-app.sh",
);
const nextConfigPath = path.join(process.cwd(), "next.config.ts");

describe("production static asset deployment", () => {
  it("publishes nginx-readable assets with a deployment cache key", async () => {
    const [deployScript, nextConfig] = await Promise.all([
      readFile(deployScriptPath, "utf8"),
      readFile(nextConfigPath, "utf8"),
    ]);

    expect(deployScript).toContain("umask 022");
    expect(deployScript).toContain('export DEPLOYMENT_VERSION="$sha"');
    expect(deployScript).toContain('chmod 0755 "$release" "$release/.next"');
    expect(deployScript).toContain('chmod -R a+rX "$release/.next/static"');
    expect(nextConfig).toContain("deploymentId: process.env.DEPLOYMENT_VERSION");
  });
});
