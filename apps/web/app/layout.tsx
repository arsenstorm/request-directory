import type { Metadata } from "next";
import "@/styles/globals.css";

// Providers
import AuthProvider from "@/auth/provider";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
	title: "Request Directory",
	description: "Request Directory",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<AuthProvider>{children}</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
