"use client";

import { Heading, Subheading } from "./heading";
import { Divider } from "./divider";
import { Text } from "./text";

export function PageHeading({
	title = "",
	description = "",
	children,
}: {
	readonly title: string | React.ReactNode;
	readonly description: string;
	readonly children?: React.ReactNode;
}) {
	return (
		<>
			<div className="flex w-full flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col">
					<Heading>{title}</Heading>
					<Text>{description}</Text>
				</div>
				<div className="flex gap-4">{children}</div>
			</div>
			<Divider className="my-6" />
		</>
	);
}

export function PageSubheading({
	title = "",
	description = "",
	level = 2,
	children,
}: {
	readonly title: string | React.ReactNode;
	readonly description: string;
	readonly level?: 1 | 2 | 3 | 4 | 5 | 6;
	readonly children?: React.ReactNode;
}) {
	return (
		<>
			<div className="flex w-full flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col">
					<Subheading level={level}>{title}</Subheading>
					<Text>{description}</Text>
				</div>
				<div className="flex gap-4">{children}</div>
			</div>
			<Divider className="my-6" soft />
		</>
	);
}
