// NestJS 12 packages are ESM-only. Jest can load them from CommonJS tests only
// when vm.SourceTextModule is available, which needs --experimental-vm-modules.
const { spawnSync } = require("node:child_process");

const result = spawnSync(
  process.execPath,
  [
    "--experimental-vm-modules",
    "--disable-warning=ExperimentalWarning",
    require.resolve("jest/bin/jest"),
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
