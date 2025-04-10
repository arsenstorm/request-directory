"use client";

import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
} from "@headlessui/react";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { MobileSearch, Search } from "./search";
import { PlusGrid, PlusGridItem, PlusGridRow } from "./plus-grid";
// UI
import { Link } from "@/components/ui/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Icons
import { Logo } from "./logo";
import { Bars2Icon } from "@heroicons/react/24/solid";

// Auth
import type { User } from "better-auth";
import { useAuth } from "@/auth/provider";
import { auth } from "@/auth/client";

const links = [{ href: "", label: "..." }];

function DesktopNav({
	user,
	signInWithGitHub,
}: Readonly<{
	user: User | null;
	signInWithGitHub: () => Promise<void>;
}>) {
	return (
		<nav className="relative hidden lg:flex">
			<PlusGridItem className="relative flex">
				<div className="flex items-center px-4 p-3 text-base font-medium text-gray-950">
					{user ? (
						<Link href="/account" className="flex items-center gap-2">
							<Avatar src={user?.image} className="size-8" />
							<p className="text-base font-medium text-gray-950">
								{user?.name ?? "Guest"}
							</p>
						</Link>
					) : (
						<Button onClick={signInWithGitHub}>Login with GitHub</Button>
					)}
				</div>
			</PlusGridItem>
		</nav>
	);
}

function MobileNavButton() {
	return (
		<DisclosureButton
			className="flex size-12 items-center justify-center self-center rounded-lg data-[hover]:bg-black/5 lg:hidden"
			aria-label="Open main menu"
		>
			<Bars2Icon className="size-6" />
		</DisclosureButton>
	);
}

function MobileNav({
	user,
	signInWithGitHub,
}: Readonly<{
	user: User | null;
	signInWithGitHub: () => Promise<void>;
}>) {
	return (
		<DisclosurePanel className="lg:hidden">
			<div className="flex flex-col gap-6 py-4">
				<motion.div
					initial={{ opacity: 0, rotateX: -90 }}
					animate={{ opacity: 1, rotateX: 0 }}
					transition={{
						duration: 0.15,
						ease: "easeInOut",
						rotateX: { duration: 0.3, delay: links.length * 0.1 },
					}}
				>
					{user ? (
						<Link href="/account" className="flex items-center gap-2">
							<Avatar src={user?.image} className="size-8" />
							<p className="text-base font-medium text-gray-950">
								Logged in as {user?.name ?? "Guest"}
							</p>
						</Link>
					) : (
						<Button className="w-full" color="dark" onClick={signInWithGitHub}>
							Login with GitHub
						</Button>
					)}
				</motion.div>
			</div>
			<div className="absolute left-1/2 w-[calc(100dvw)] -translate-x-1/2">
				<div className="absolute inset-x-0 top-0 border-t border-black/5" />
				<div className="absolute inset-x-0 top-2 border-t border-black/5" />
			</div>
		</DisclosurePanel>
	);
}

export default function Navbar({ config }: Readonly<{ config: any }>) {
	const { user } = useAuth();

	const signInWithGitHub = useCallback(async () => {
		await auth.signIn.social({
			provider: "github",
			callbackURL: `${window.location.origin}/account`,
		});
	}, []);

	return (
		<Disclosure as="header" className="my-4">
			<PlusGrid>
				<PlusGridRow className="relative flex justify-between">
					<div className="relative flex">
						<PlusGridItem className="p-3">
							<Link href="/" title="Home">
								<Logo className="h-9" />
							</Link>
						</PlusGridItem>
						<PlusGridItem className="p-3 items-center w-96 hidden lg:flex">
							<Search config={config} />
						</PlusGridItem>
					</div>
					<DesktopNav user={user} signInWithGitHub={signInWithGitHub} />
					<div className="flex lg:hidden flex-row items-center gap-0.5">
						<div className="flex size-12 items-center justify-center self-center rounded-lg hover:bg-black/5 lg:hidden">
							<MobileSearch config={config} />
						</div>
						<MobileNavButton />
					</div>
				</PlusGridRow>
			</PlusGrid>
			<MobileNav user={user} signInWithGitHub={signInWithGitHub} />
		</Disclosure>
	);
}
