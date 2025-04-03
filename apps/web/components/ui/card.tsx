"use client";

import { Button } from "./button";
import { Subheading } from "./heading";
import { Link } from "./link";
import { Text } from "./text";
import clsx from "clsx";

type CardBaseProps = {
	readonly className?: string;
	readonly onClick?: () => void;
};

type CardWithTitleProps = CardBaseProps & {
	readonly title: string;
	readonly description: string;
	readonly href?: string;
	readonly cta?: string;
	readonly children?: never;
};

type CardWithChildrenProps = CardBaseProps & {
	readonly title?: never;
	readonly description?: never;
	readonly href?: never;
	readonly cta?: never;
	readonly children: React.ReactNode;
};

type CardProps = CardWithTitleProps | CardWithChildrenProps;

export function Card({
	title = "",
	description = "",
	href = "",
	cta = undefined,
	className = "",
	onClick = undefined,
	children,
	...props
}: CardProps): React.ReactNode {
	// If children are provided, render a simple card with children
	if (children) {
		return (
			<div
				className={clsx(
					"bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg",
					className,
				)}
				{...props}
				onClick={onClick}
			>
				{children}
			</div>
		);
	}

	// Original card implementation
	if (!href) {
		return (
			<div
				className={clsx(
					"flex bg-zinc-100 dark:bg-zinc-800 px-4 py-6 border border-zinc-200 dark:border-zinc-700 rounded-lg",
					className,
				)}
				{...props}
				onClick={onClick}
			>
				<div className="flex flex-col">
					<Subheading level={4}>{title}</Subheading>
					<Text>{description}</Text>
				</div>
			</div>
		);
	}

	return (
		<Link
			href={href}
			className={clsx(
				"flex flex-col lg:flex-row bg-zinc-100 dark:bg-zinc-800 px-4 py-6 border border-zinc-200 dark:border-zinc-700 rounded-lg gap-4",
				className,
			)}
			{...props}
		>
			<div className="flex flex-col">
				<Subheading level={4}>{title}</Subheading>
				<Text>{description}</Text>
			</div>
			<div className="lg:ml-auto flex flex-col justify-center w-fit">
				<Button>{cta ?? "Take me there"}</Button>
			</div>
		</Link>
	);
}

export function CardGroup({
	children,
}: {
	readonly children: React.ReactNode;
}): React.ReactNode {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
	);
}
