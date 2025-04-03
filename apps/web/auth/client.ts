import { createAuthClient } from "better-auth/react";
import type { auth as server } from "./server";
import {
	apiKeyClient,
	inferAdditionalFields,
} from "better-auth/client/plugins";

export const auth = createAuthClient({
	plugins: [apiKeyClient(), inferAdditionalFields<typeof server>()],
});
