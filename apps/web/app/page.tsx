import { Badge } from "@/components/ui/badge";
import { Heading, Subheading } from "@/components/ui/heading";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { config } from "@/utils/get-config";
import { getTagColor } from "@/utils/get-tag-color";

export const dynamic = "force-static";

export default function Home() {
	return (
		<main>
			<Heading>Request Directory</Heading>
			<Text>
				Browse through a curated list of APIs to find the perfect one for your
				needs.
			</Text>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0.5 mt-8">
				{config.map((api) => (
					<APICard
						id={api.slug}
						key={api.slug}
						name={api.name}
						description={api.description}
						tag={{ name: api.tag, color: getTagColor(api.tag) }}
					/>
				))}
			</div>
		</main>
	);
}

function APICard({
	id,
	name,
	description,
	tag,
}: Readonly<{
	id: string;
	name: string;
	description: string;
	tag: {
		name: string;
		color?:
			| "blue"
			| "green"
			| "red"
			| "yellow"
			| "purple"
			| "pink"
			| "orange"
			| "amber"
			| "lime"
			| "emerald"
			| "teal"
			| "cyan"
			| "sky"
			| "indigo"
			| "violet"
			| "fuchsia"
			| "rose"
			| "zinc";
	};
}>) {
	return (
		<Link
			className="bg-white p-4 rounded-3xl h-36 relative border border-neutral-200/75"
			href={`/${id}`}
		>
			<Subheading>{name}</Subheading>
			<Text>{description}</Text>
			<div className="absolute top-0 right-0 p-4">
				<Badge color={tag.color}>{tag.name}</Badge>
			</div>
		</Link>
	);
}
