import { betterAuth } from "better-auth";
import { apiKey } from "better-auth/plugins";

import { Pool } from "pg";
import dotenv from "dotenv";

import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

const client = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN,
	// Use 'sandbox' if you're using the Polar Sandbox environment
	// Remember that access tokens, products, etc. are completely separated between environments.
	// Access tokens obtained in Production are for instance not usable in the Sandbox environment.
	server: "sandbox",
});

dotenv.config();

export const auth = betterAuth({
	appName: "Request Directory",
	advanced: {
		cookiePrefix: "requests",
	},
	database: new Pool({
		connectionString: process.env.DATABASE_URL,
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: false,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	plugins: [
		apiKey({
			defaultPrefix: "rd_",
		}),
		polar({
			client,
			// Enable automatic Polar Customer creation on signup
			createCustomerOnSignUp: true,
			// Enable customer portal
			enableCustomerPortal: true, // Deployed under /portal for authenticated users
			// Configure checkout
			checkout: {
				enabled: false,
				products: [
					{
						productId: "00000000-0000-0000-0000-000000000000",
						slug: "top-up",
					},
				],
				successUrl: "/?checkout_id={CHECKOUT_ID}",
			},
			// Incoming Webhooks handler will be installed at /polar/webhooks
			webhooks: {
				secret: process.env.POLAR_WEBHOOK_SECRET as string,
				onPayload: async (payload) => {
					console.log(payload);
				},
			},
		}),
	],
	trustedOrigins: [
		...(process.env.NODE_ENV === "production"
			? ["https://request.directory"]
			: ["http://localhost:3000", "https://localhost:3000"]),
	],
});
