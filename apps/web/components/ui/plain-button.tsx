"use client";

import * as Headless from "@headlessui/react";
import { clsx } from "clsx";
import React from "react";
import { Link } from "./link";

type ButtonProps = {
	className?: string;
	children: React.ReactNode;
} & (
	| Omit<Headless.ButtonProps, "className">
	| Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">
);

export const Button = React.forwardRef(function Button(
	{ className, children, ...props }: ButtonProps,
	ref: React.ForwardedRef<HTMLElement>,
) {
	const classes = clsx(
		"relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border text-base/6 font-semibold",
		// Sizing
		"px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] sm:text-sm/6",
		// Focus
		"focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-blue-500",
		// Disabled
		"data-[disabled]:opacity-50",
		// Icon
		"[&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:text-[--btn-icon] [&>[data-slot=icon]]:sm:my-1 [&>[data-slot=icon]]:sm:size-4 forced-colors:[--btn-icon:ButtonText] forced-colors:data-[hover]:[--btn-icon:ButtonText]",
		// Other
		className,
	);

	return "href" in props ? (
		<Link
			{...props}
			className={classes}
			ref={ref as React.ForwardedRef<HTMLAnchorElement>}
		>
			<TouchTarget>{children}</TouchTarget>
		</Link>
	) : (
		<Headless.Button
			{...props}
			className={clsx(classes, "cursor-default")}
			ref={ref}
		>
			<TouchTarget>{children}</TouchTarget>
		</Headless.Button>
	);
});

/**
 * Expand the hit area to at least 44×44px on touch devices
 */
export function TouchTarget({
	children,
}: { readonly children: React.ReactNode }) {
	return (
		<>
			<span
				className="absolute left-1/2 top-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
				aria-hidden="true"
			/>
			{children}
		</>
	);
}
