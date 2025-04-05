import { env } from "@/utils/env/get";
import { getConfig } from "@/utils/get-config";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	_request: NextRequest,
	{
		params,
	}: Readonly<{
		params: Promise<{
			id: string;
		}>;
	}>,
) {
	const { id } = await params;

	const config = await getConfig({ type: "api" }).then((configs) =>
		configs.find((config) => config.slug === id)
	);

	if (!config) {
		console.warn("Config not found", id);
		return NextResponse.json(
			{
				error: "This provider does not exist.",
				hint: "Check the docs at https://request.directory",
			},
			{
				status: 400,
			},
		);
	}

	const enabled = env(
		`${config.slug.toUpperCase().replace(/-/g, "_")}_ENABLED`,
		{
			default: "false",
		},
	);

	return NextResponse.json({
		status: enabled === "true" ? "ok" : "bad",
		name: config.name,
		docs: `https://request.directory/${config.name}`,
	});
}
