// UI
import { Heading, Subheading } from "@/components/ui/heading";
import { Code, Text } from "@/components/ui/text";

// Utils
import { getConfig } from "@/utils/get-config";

// Hooks
import { notFound } from "next/navigation";

// Client
import { Playground } from "./page.client";
import { Divider } from "@/components/ui/divider";

export async function generateMetadata({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const config = await getConfig();

	const api = config.find((api) => api.slug === id);

	if (!api) {
		return {
			title: "API Not Found",
			description: "The API you are looking for does not exist.",
		};
	}

	return {
		title: api.name,
		description: api.description,
	};
}

export default async function API({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const config = await getConfig();

	const api = config.find((api) => api.slug === id);

	if (!api) {
		return notFound();
	}

	return (
		<main>
			<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
				<div className="flex flex-col">
					<Heading>{api.name}</Heading>
					<Text>{api.description}</Text>
				</div>
			</div>
			<div className="mt-4">
				<Text>
					To use this API, make a <Code>POST</Code> request to this endpoint:{" "}
					<Code>https://request.directory/v1/{id}</Code> with your API key
					in the <Code>x-api-key</Code> header.
				</Text>
			</div>
			<Divider className="my-4" />
			<Playground config={api} />
		</main>
	);
}

export async function generateStaticParams() {
	const config = await getConfig();

	return config.map((api) => ({
		id: api.slug,
	}));
}
