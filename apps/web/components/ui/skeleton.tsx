"use client";

import clsx from "clsx";

export function Skeleton({
	className = undefined,
}: {
	readonly className?: string;
}): React.ReactNode {
	if (!className) {
		className = "h-[500px] w-full";
	}

	return (
		<div
			className={clsx(
				"bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 animate-pulse rounded-lg",
				className,
			)}
		/>
	);
}
