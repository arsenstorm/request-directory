import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();

const { combinedEnv } = loadEnvConfig(projectDir);

const env = Object.fromEntries(
	Object.entries(combinedEnv)
		.filter(([key]) =>
			!key.startsWith("NODE") && !key.startsWith("__") && key !== "NEXT_RUNTIME"
		)
		.map(([key, value]) => [key, value]),
);

const nextConfig: NextConfig = {
	output: "standalone",
	env,
};

export default nextConfig;
