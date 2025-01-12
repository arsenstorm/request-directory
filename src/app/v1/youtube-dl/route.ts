// Types
import { type NextRequest, NextResponse } from "next/server";

// Config
import config from "./config";

// Utils
import { createClient } from "@/utils/supabase/server";
import { getEstimatedCost } from "@/utils/get-estimated-cost";
import { updateFunds } from "@/utils/api/update-funds";
import { logRequest } from "@/utils/api/log-request";
import { shouldSaveEncrypt } from "@/utils/api/should-save-encrypt";

// Returning Utils
import { returnIsEnabled } from "@/utils/api/returning/is-enabled";
import { returnCheckEnv } from "@/utils/api/returning/check-env";

export async function POST(req: NextRequest) {
	const authorization = req.headers.get("authorization") ?? undefined;

	const supabase = createClient(authorization);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json(
			{
				error: "Unauthorized",
			},
			{
				status: 401,
			},
		);
	}

	const { encrypt } = await shouldSaveEncrypt(req);

	await returnIsEnabled("youtube-dl");

	const { estimated = 0.01 } = await getEstimatedCost("youtube-dl");

	const actual = estimated;

	// NOTE: Since we're using a custom way of signing a user in with their API key,
	// we need to make sure that any Supabase RLS policies are applied to the `public` role
	// and not the `authenticated` role.
	const { data: userData, error: userError } = await supabase
		.from("users")
		.select("id, funds")
		.single();

	if (userError) {
		console.error(userError);
		return NextResponse.json(
			{
				message: "Failed to get user funds.",
			},
			{
				status: 400,
			},
		);
	}

	if (userData.funds - estimated < 0) {
		return NextResponse.json(
			{
				message: "You don’t have enough credits.",
			},
			{
				status: 400,
			},
		);
	}

	// NOTE: If `actual` is null, we'll subtract the estimated cost,
	// then later, we'll calculate the actual cost and update the funds again.
	const updatedUserData = await updateFunds(userData, actual, estimated);

	await returnCheckEnv(config?.env ?? []);

	const requestId = await logRequest({
		userId: userData.id,
		service: "youtube-dl",
		status: "pending",
		encrypt,
	});

	let videoUrl: string;

	const contentType = req.headers.get("content-type");

	if (contentType?.includes("application/json")) {
		const body = await req.json();

		await logRequest({
			requestId,
			userId: userData.id,
			service: "youtube-dl",
			status: "pending",
			requestData: body,
			encrypt,
		});

		const { url } = body;

		if (!url) {
			return NextResponse.json(
				{
					message: "You haven't provided a URL. The `url` field is required.",
				},
				{
					status: 400,
				},
			);
		}

		videoUrl = url;
	} else {
		return NextResponse.json(
			{
				message:
					"Only JSON requests are supported. Please send a JSON body with a 'url' field.",
			},
			{
				status: 400,
			},
		);
	}

	try {
		const apiResponse = await fetch(
			`${process.env.YOUTUBE_DL_URL ?? "http://localhost:7005/download"}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ url: videoUrl }),
			},
		);

		if (!apiResponse.ok) {
			throw new Error("Failed to download video from YouTube.");
		}

		const data = await apiResponse.json();

		// Update funds
		await updateFunds(userData, actual, 0);

		const response = {
			...data,
			success: true,
			funds: {
				remaining: userData ? userData.funds - actual : null,
				actual,
			},
		};

		await logRequest({
			requestId,
			userId: userData.id,
			service: "youtube-dl",
			status: "success",
			responseData: response,
			cost: actual ?? estimated,
			encrypt,
		});

		return NextResponse.json(response, {
			status: 200,
		});
	} catch (error) {
		console.error(error);

		const response = {
			message: "Failed to get response from YouTube Downloader.",
			funds: {
				remaining: updatedUserData?.[0]?.funds ?? null,
				actual: 0,
			},
		};

		await updateFunds(userData, estimated, 0, "add");

		await logRequest({
			requestId,
			userId: userData.id,
			service: "youtube-dl",
			status: "failed",
			responseData: response,
			cost: 0, // we don't charge for failed requests
			encrypt,
		});
		return NextResponse.json(
			{
				message: "Failed to get response from YouTube Downloader.",
			},
			{
				status: 400,
			},
		);
	}
}
