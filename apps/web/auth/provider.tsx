"use client";

// React
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

// Better Auth
import { auth } from "@/auth/client";
import type { Session, User } from "better-auth";

export type UserWithAdditionalFields = User & {
	balance?: number | null;
};

/**
 * The user's session context.
 */
export interface AuthSessionContext {
	readonly session: Session | null;
	readonly user: UserWithAdditionalFields | null;
	readonly status: "loading" | "authenticated" | "unauthenticated";
	readonly update: () => void;
	readonly balance?: number | null;
}

export const AuthContext = createContext<AuthSessionContext>({
	session: null,
	user: null,
	status: "loading",
	update: () => {},
	balance: 0,
});

export function useAuth() {
	return useContext(AuthContext);
}

export default function AuthProvider({
	children,
}: {
	readonly children: React.ReactNode;
}): React.ReactNode {
	const [user, setUser] = useState<UserWithAdditionalFields | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [status, setStatus] = useState<AuthSessionContext["status"]>("loading");

	const { data, isPending, refetch } = auth.useSession();

	const update = useCallback(async () => {
		setStatus("loading");
		refetch();
	}, [refetch]);

	useEffect(() => {
		setSession(data?.session ?? null);
		setUser(data?.user as UserWithAdditionalFields | null);

		if (!isPending) {
			setStatus(data?.session ? "authenticated" : "unauthenticated");
		}
	}, [data, isPending]);

	const value = useMemo(
		() => ({
			session,
			user,
			status,
			update,
			balance: user?.balance ?? 0,
		}),
		[session, user, status, update],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
