import { env } from "@/utils/env/get";
import { authorise } from "@/auth/authorise";
import { type ApiPath, getConfig } from "@/utils/get-config";
import { after, type NextRequest, NextResponse } from "next/server";

// Node
import { Readable } from "node:stream";

const handleRequest = async (
	request: NextRequest,
	{
		params,
	}: Readonly<{
		params: Promise<{
			id: string;
			all: string[];
		}>;
	}>,
) => {
	const { id, all } = await params;

	const { valid, userId } = await authorise(request);

	if (!valid || !userId) {
		return NextResponse.json(
			{
				error: "Invalid API key.",
			},
			{ status: 401 },
		);
	}

	const config = await getConfig({ type: "api" }).then((configs) =>
		configs.find((config) => config.slug === id)
	);

	if (!config) {
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

	if (enabled !== "true") {
		return NextResponse.json(
			{ error: "Provider is disabled." },
			{ status: 400 },
		);
	}

	const { port, api } = config;

	const requestPath = `@${request.method.toLowerCase()}/${
		all.join(
			"/",
		)
	}` as ApiPath;

	const requestConfig = api?.[requestPath];

	if (!requestConfig) {
		return NextResponse.json(
			{
				error: "Invalid request path.",
			},
			{
				status: 400,
			},
		);
	}

	const hostname = env("DOCKER_ENV", {
			default: "false",
		}) === "true"
		? `${id}`
		: "localhost";

	const url = new URL(`http://${hostname}:${port}/${all.join("/")}`);

	try {
		const headers = new Headers();
		for (const [key, value] of request.headers.entries()) {
			headers.set(key, value);
		}

		const body = Readable.fromWeb(request.body as any);

		const response = await fetch(url, {
			method: request.method,
			headers: request.headers,
			// @ts-expect-error: add the body stream
			body,
			duplex: "half",
		});

		const responseBody = await response.json();

		const success = response.ok;

		// if we're a success, we need to charge the user the price of the API
		if (success) {
			after(async () => {
				const price = config.pricing.price;

				console.log(price, userId);
			});
		}

		// Try to parse the response as JSON, fallback to text if it fails
		let parsedResponse: Record<string, unknown>;
		try {
			parsedResponse = JSON.parse(responseBody);
		} catch (e) {
			parsedResponse = responseBody;
		}

		return NextResponse.json(parsedResponse);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{
				error: "Internal server error.",
				message:
					"We've encountered an error while processing your request. You have not been charged.",
			},
			{
				status: 500,
			},
		);
	}
};

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
