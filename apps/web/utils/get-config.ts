import "server-only";

import { glob } from "fast-glob";
import fs from "node:fs";

export type ApiPath = `@${"get" | "post" | "put" | "delete"}/${string}`;

export interface Config {
  name: string;
  slug: string;
  port: number;
  pricing: {
    type: "fixed";
    price: number;
  };
  tag:
    | "Moderation"
    | "Generative"
    | "Utility"
    | "Vision"
    | "Audio"
    | "Video"
    | "Coming Soon";
  api: Record<ApiPath, {
    input: {
      type: "json" | "formdata";
      parameters: Record<string, {
        type: "string" | "number" | "boolean" | "file";
        required: boolean;
      }>;
    };
  }>;
}

export async function getConfig(): Promise<Config[]> {
  const configFiles = await glob(
    "../../packages/**/config.json",
  );

  return configFiles.map((file) => {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  });
}
