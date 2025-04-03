"use client";

import { Text, TextLink, Strong } from "./text";
import { Heading } from "./heading";
import { Fragment } from "react";
import { clsx } from "clsx";

const ChevronRightIcon = ({ className }: Readonly<{ className?: string }>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth="1.5"
		stroke="currentColor"
		className={clsx("size-6", className)}
	>
		<title>{""}</title>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m8.25 4.5 7.5 7.5-7.5 7.5"
		/>
	</svg>
);

export function PageBreadcrumbs({
	useHeading = true,
	items = [],
	current,
	...props
}: {
	readonly useHeading?: boolean; // Use the Heading component to render the breadcrumbs instead of Text
	readonly items: {
		readonly name: string;
		readonly href: string;
	}[];
	readonly current: string;
	readonly props?: any;
}) {
	const Wrapper = useHeading ? Heading : Text;

	return (
		<div {...props}>
			<Wrapper className="flex flex-row gap-x-1 items-center">
				{items.map((item) => (
					<Fragment key={item.name}>
						<TextLink href={item.href}>
							<Strong>{item.name}</Strong>
						</TextLink>
						<ChevronRightIcon className="size-4" />
					</Fragment>
				))}
				<Strong>{current}</Strong>
			</Wrapper>
		</div>
	);
}
