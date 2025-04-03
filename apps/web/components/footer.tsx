import { PlusGrid, PlusGridItem, PlusGridRow } from "./plus-grid";
import { Link } from "@/components/ui/link";

function SocialIconX(props: Readonly<React.ComponentPropsWithoutRef<"svg">>) {
	return (
		<svg viewBox="0 0 16 16" fill="currentColor" {...props}>
			<title>X</title>
			<path d="M12.6 0h2.454l-5.36 6.778L16 16h-4.937l-3.867-5.594L2.771 16H.316l5.733-7.25L0 0h5.063l3.495 5.114L12.6 0zm-.86 14.376h1.36L4.323 1.539H2.865l8.875 12.837z" />
		</svg>
	);
}

function SocialIconGitHub(
	props: Readonly<React.ComponentPropsWithoutRef<"svg">>,
) {
	return (
		<svg viewBox="0 0 16 16" fill="currentColor" {...props}>
			<title>GitHub</title>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8 .198a8 8 0 0 0-8 8 7.999 7.999 0 0 0 5.47 7.59c.4.076.547-.172.547-.384 0-.19-.007-.694-.01-1.36-2.226.482-2.695-1.074-2.695-1.074-.364-.923-.89-1.17-.89-1.17-.725-.496.056-.486.056-.486.803.056 1.225.824 1.225.824.714 1.224 1.873.87 2.33.666.072-.518.278-.87.507-1.07-1.777-.2-3.644-.888-3.644-3.954 0-.873.31-1.586.823-2.146-.09-.202-.36-1.016.07-2.118 0 0 .67-.214 2.2.82a7.67 7.67 0 0 1 2-.27 7.67 7.67 0 0 1 2 .27c1.52-1.034 2.19-.82 2.19-.82.43 1.102.16 1.916.08 2.118.51.56.82 1.273.82 2.146 0 3.074-1.87 3.75-3.65 3.947.28.24.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38A7.972 7.972 0 0 0 16 8.199a8 8 0 0 0-8-8Z"
			/>
		</svg>
	);
}

function SocialLinks() {
	return (
		<>
			<Link
				href="https://github.com/arsenstorm"
				target="_blank"
				aria-label="Visit me on GitHub"
				className="text-gray-950 data-[hover]:text-gray-950/75"
			>
				<SocialIconGitHub className="size-4" />
			</Link>
			<Link
				href="https://x.com/arsenstorm"
				target="_blank"
				aria-label="Visit me on X"
				className="text-gray-950 data-[hover]:text-gray-950/75"
			>
				<SocialIconX className="size-4" />
			</Link>
		</>
	);
}

function Copyright() {
	return (
		<div className="text-sm/6 text-gray-950">
			&copy; {new Date().getFullYear()} Arsen Shkrumelyak.
		</div>
	);
}

export default function Footer() {
	return (
		<footer className="my-4">
			<PlusGrid>
				<PlusGridRow className="flex justify-between">
					<div>
						<PlusGridItem className="p-3">
							<Copyright />
						</PlusGridItem>
					</div>
					<div className="flex">
						<PlusGridItem className="flex items-center gap-8 p-3">
							<SocialLinks />
						</PlusGridItem>
					</div>
				</PlusGridRow>
			</PlusGrid>
		</footer>
	);
}
