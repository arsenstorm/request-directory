import { betterAuth } from "better-auth";
import { apiKey } from "better-auth/plugins";

import { Pool } from "pg";

import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/utils/env/get";

const client = new Polar({
	accessToken: env("POLAR_ACCESS_TOKEN"),
	// Use 'sandbox' if you're using the Polar Sandbox environment
	// Remember that access tokens, products, etc. are completely separated between environments.
	// Access tokens obtained in Production are for instance not usable in the Sandbox environment.
	server: env("NODE_ENV") === "production" ? "production" : "sandbox",
});

export const auth = betterAuth({
	appName: "Request Directory",
	advanced: {
		cookiePrefix: "requests",
	},
	database: new Pool({
		connectionString: env("DATABASE_URL"),
	}),
	secret: env("BETTER_AUTH_SECRET"),
	emailAndPassword: {
		enabled: false,
	},
	user: {
		additionalFields: {
			balance: {
				type: "number",
				defaultValue: 0,
				bigint: true,
				required: false,
				transform: {
					input() {
						throw new Error("Modifying the balance is not allowed.");
					},
				},
				returned: true,
			},
		},
	},
	socialProviders: {
		github: {
			clientId: env("GITHUB_CLIENT_ID") as string,
			clientSecret: env("GITHUB_CLIENT_SECRET") as string,
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
				secret: env("POLAR_WEBHOOK_SECRET") as string,
				onPayload: async (payload) => {
					console.log(payload);
				},
			},
		}),
	],
	trustedOrigins: [
		...(env("NODE_ENV") === "production"
			? ["https://request.directory"]
			: ["http://localhost:3000", "https://localhost:3000"]),
	],
});
