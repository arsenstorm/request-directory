import type { Metadata } from "next";
import "@/styles/globals.css";

// Providers
import AuthProvider from "@/auth/provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { getConfig } from "@/utils/get-config";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
	title: {
		default: "Request Directory - Find the perfect API.",
		template: "%s - Request Directory",
	},
	description:
		"An open-source alternative to RapidAPI, allowing you to use APIs for pretty much anything with a single API key!",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const config = await getConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link
					rel="stylesheet"
					href="https://api.fontshare.com/css?f%5B%5D=switzer@400,500,600,700&amp;display=swap"
				/>
			</head>
			<body className="antialiased bg-neutral-100/50">
				<ThemeProvider forcedTheme="light">
					<AuthProvider>
						<div className="flex flex-col flex-1 min-h-screen px-4">
							<Navbar config={config} />
							<div className="flex-1">{children}</div>
							<Footer />
						</div>
						<Toaster />
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
