import path from "node:path";
import dotenv from "dotenv";

const projectDir = path.join(process.cwd(), "..", "..");

const combinedEnv =
  dotenv.config({
    path: path.join(
      projectDir,
      process.env.NODE_ENV === "production" ? ".env" : ".env.local",
    ),
  })
    .parsed;

if (!combinedEnv) {
  throw new Error("Failed to load environment variables");
}

export const env = Object.fromEntries(
  Object.entries(combinedEnv)
    .filter(([key]) =>
      !key.startsWith("NODE") && !key.startsWith("__") && key !== "NEXT_RUNTIME"
    )
    .map(([key, value]) => [key, value]),
);

process.env = {
  ...process.env,
  ...env,
};
