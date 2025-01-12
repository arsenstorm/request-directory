import type { APIConfig } from "@/types/config";

export const tiktokDlConfig = {
	details: {
		name: "TikTok Downloader",
		oneLiner: "Download TikTok videos.",
		tag: "Video",
	},
	pricing: {
		estimated: 0.0001, // roughly $0.0001 per video downloaded
		price: 0.0001,
	},
	request: {
		method: "POST",
		type: "json",
	},
	inputs: [
		{
			id: "url",
			type: "string",
			name: "TikTok URL",
			description: "The URL of the TikTok video to download.",
			required: true,
		},
	],
	outputs: [
		{
			id: "download_url",
			type: "video",
			name: "Video",
			description: "The video downloaded from the TikTok URL.",
		},
	],
} as APIConfig;

export default tiktokDlConfig;
