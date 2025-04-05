import "server-only";

import fs from "node:fs";
import { env } from "./env/get";
import { glob } from "fast-glob";

export type ApiPath = `@${"get" | "post" | "put" | "delete"}/${string}`;

export interface Config {
	name: string;
	slug: string;
	description: string;
	enabled: boolean;
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
	api: Record<
		ApiPath,
		{
			input: {
				type: "json" | "formdata";
				parameters: Record<
					string,
					{
						type: "string" | "number" | "boolean" | "file";
						required: boolean;
						name?: string;
						description?: string;
						blur?: boolean;
					}
				>;
			};
			output?: {
				type: "json";
				parameters: Record<
					string,
					{
						type: "string" | "array" | "number" | "boolean";
						required: boolean;
						name?: string;
						description?: string;
						blur?: boolean;
					}
				>;
			};
		}
	>;
}

export async function getConfig({
	type = "ui",
}: {
	type?: "ui" | "api";
} = {
	type: "ui",
}): Promise<Config[]> {
	const config: Config[] = [];

	const configPath = process.env.NODE_ENV === "production" && type === "api"
		? "./packages/**/config.json" // Docker path - works for apis
		: "../../packages/**/config.json"; // Dev path - works for ui

	const configFiles: Config[] = (await glob(configPath))
		.map(
			(file) => {
				return JSON.parse(fs.readFileSync(file, "utf8"));
			},
		)
		.sort((a, b) => a.port - b.port);

	for (const c of configFiles) {
		const enabled = env(
			`${c.slug.toUpperCase().replaceAll("-", "_")}_ENABLED`,
			{
				default: "false",
			},
		) === "true";

		c.enabled = enabled;

		config.push(c);
	}

	return config;
}

export const config = await getConfig();
