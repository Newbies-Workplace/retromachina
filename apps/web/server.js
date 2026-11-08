import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import fallback from "express-history-api-fallback";
import helmet from "helmet";

const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

const app = express();

// CSP is left off until the allowed API, socket and image origins are listed.
app.use(helmet({ contentSecurityPolicy: false }));
// Source maps are built ("hidden") for debugging but are not served publicly.
app.use((req, res, next) => {
  if (req.path.endsWith(".map")) return res.status(404).end();
  next();
});

// config stuff
const publicDir = path.join(_dirname, "dist");
const port = process.env.SERVER_PORT || 8080;

// fallback to index.html
app.use(express.static(publicDir));
app.use(fallback(path.join(publicDir, "index.html")));

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
