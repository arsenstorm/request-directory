import { authorise } from "@/auth/authorise";
import { type ApiPath, getConfig } from "@/utils/get-config";
import { after, type NextRequest, NextResponse } from "next/server";

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

	const configFiles = await getConfig();

	const config = configFiles.find((config) => config.slug === id);

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

	const { input } = requestConfig;

	const { type, parameters } = input;

	let body: any;

	switch (type) {
		case "formdata":
			body = await request.formData();
			break;
		case "json":
			body = await request.json();
			break;
		default:
			body = await request.text();
			break;
	}

	for (const [key, value] of Object.entries(parameters)) {
		if (value.required && (type === "formdata" ? !body.has(key) : !body[key])) {
			return NextResponse.json(
				{
					error: `Missing required parameter: ${key}`,
				},
				{
					status: 400,
				},
			);
		}
	}

	const url = new URL(`http://localhost:${port}/${all.join("/")}`);

	try {
		const response = await fetch(url, {
			method: request.method,
			headers: {
				...request.headers,
				...(type === "json" ? { "Content-Type": "application/json" } : {}),
			},
			body: type === "json" ? JSON.stringify(body) : body,
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
