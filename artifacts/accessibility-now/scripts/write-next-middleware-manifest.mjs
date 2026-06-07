import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join(
  process.cwd(),
  ".next",
  "server",
  "middleware-manifest.json",
);

if (!fs.existsSync(manifestPath)) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        version: 1,
        middleware: {},
        functions: {},
        sortedMiddleware: [],
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  console.log(`Wrote compatibility middleware manifest to ${manifestPath}`);
}
