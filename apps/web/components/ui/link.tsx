"use client";

// React
import React from "react";

// Headless UI
import { DataInteractive as HeadlessDataInteractive } from "@headlessui/react";

// Link
import NextLink, { type LinkProps } from "next/link";

export const Link = React.forwardRef(function Link(
	props: LinkProps & React.ComponentPropsWithoutRef<"a">,
	ref: React.ForwardedRef<HTMLAnchorElement>,
) {
	return (
		<HeadlessDataInteractive>
			<NextLink ref={ref} prefetch {...props} />
		</HeadlessDataInteractive>
	);
});
