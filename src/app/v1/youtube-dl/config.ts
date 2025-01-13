import type { APIConfig } from "@/types/config";

export const youtubeDlConfig = {
	details: {
		name: "YouTube Downloader",
		oneLiner: "Download YouTube videos.",
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
			name: "YouTube URL",
			description: "The URL of the YouTube video to download.",
			required: true,
		},
	],
	outputs: [
		{
			id: "video_url",
			type: "video",
			name: "Video",
			description: "The video downloaded from the YouTube URL.",
		},
	],
} as APIConfig;

export default youtubeDlConfig;
