import { useOs as getOs } from "@mantine/hooks";

export function getCommandKey() {
	const os = getOs();

	if (os === "undetermined") {
		return { device: "desktop", key: "Ctrl" };
	}

	return {
		device: ["windows", "linux", "macos"].includes(os) ? "desktop" : "mobile",
		key: os === "macos" ? "⌘" : "Ctrl",
	};
}
