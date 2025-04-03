import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";

export default function NotFound() {
	return (
		<main className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
			<Badge color="red" className="mb-4">
				404
			</Badge>
			<Heading className="mb-2">Page Not Found</Heading>
			<Text className="mb-6 max-w-lg text-balance">
				We couldn&apos;t find the page you were looking for. It might have been
				moved or deleted.
			</Text>
			<Link
				href="/"
				className="bg-white px-2 py-1 rounded-3xl border border-neutral-200/75 hover:border-neutral-300/75 transition-colors text-sm"
			>
				<span className="flex items-center gap-2">
					← Return to the home page
				</span>
			</Link>
		</main>
	);
}
