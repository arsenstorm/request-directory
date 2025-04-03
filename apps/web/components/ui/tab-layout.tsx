"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

interface TabLayoutItems {
	id: string;
	name: string;
	children: React.ReactNode;
}

export default function TabLayout({
	items = [],
}: {
	readonly items: TabLayoutItems[];
}) {
	return (
		<TabGroup defaultIndex={0}>
			<TabList className="flex gap-4">
				{items.map((item) => (
					<Tab
						key={item.id}
						disabled={item.children === null}
						className="rounded-full py-1 px-3 text-sm/6 font-semibold dark:text-white focus:outline-none data-[selected]:bg-black/5 data-[hover]:bg-black/2.5 data-[selected]:data-[hover]:bg-black/5 data-[focus]:outline-1 data-[focus]:outline-black dark:data-[selected]:bg-white/5 dark:data-[hover]:bg-white/2.5 dark:data-[selected]:data-[hover]:bg-white/5 dark:data-[focus]:outline-1 dark:data-[focus]:outline-white disabled:cursor-not-allowed disabled:opacity-50"
					>
						{item.name}
					</Tab>
				))}
			</TabList>
			<TabPanels className="mt-3">
				{items.map((item) => (
					<TabPanel
						key={item.id}
						className="rounded-xl p-3 bg-black/5 dark:bg-white/5"
					>
						{item.children}
					</TabPanel>
				))}
			</TabPanels>
		</TabGroup>
	);
}
