"use client";

// UI
import { Code, Text } from "@/components/ui/text";
import {
	Description,
	Field,
	FieldGroup,
	Fieldset,
	Label,
	Legend,
} from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Listbox, ListboxOption, ListboxLabel } from "@/components/ui/listbox";
import Markdown from "react-markdown";

// Functions
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

// Hooks
import { useEventListener } from "@mantine/hooks";
import { toast } from "sonner";

// Types
import type { Config, ApiPath } from "@/utils/get-config";

interface InputField {
	id: string;
	type: "string" | "number" | "boolean" | "file";
	name: string;
	required: boolean;
	description?: string;
	blur?: boolean;
}

interface OutputField {
	id: string;
	type: "string" | "array" | "image" | "video" | "unknown";
	name: string;
	description?: string;
	blur?: boolean;
	required?: boolean;
}

export function Playground({
	config,
}: {
	config: Config;
}) {
	const [response, setResponse] = useState<any>(null);
	const [selectedEndpoint, setSelectedEndpoint] = useState<ApiPath | null>(
		Object.keys(config.api)[0] as ApiPath,
	);
	const endpoints = Object.keys(config.api) as ApiPath[];

	useEffect(() => {
		if (endpoints.length > 0 && !selectedEndpoint) {
			setSelectedEndpoint(endpoints[0]);
		}
	}, [endpoints, selectedEndpoint]);

	const handleSubmit = async (data: any) => {
		if (!selectedEndpoint) return;

		const apiConfig = config.api[selectedEndpoint];
		const contentType = apiConfig.input.type ?? "json"; // Default to JSON if not specified
		const formData = new FormData();
		const [method, path] = selectedEndpoint.slice(1).split("/");

		try {
			const startTime = performance.now();

			// Handle request based on content type
			if (contentType === "formdata") {
				// Append each field to FormData
				for (const key in data) {
					if (data[key]?.file) {
						formData.append(key, data[key].file); // Append file
					} else {
						formData.append(key, data[key] ?? ""); // Append other data
					}
				}

				const response = await fetch(`/v1/${config.slug}/${path}`, {
					method: method.toUpperCase(),
					body: formData,
				});

				const json = await response.json();
				setResponse(json);
				return {
					data: json,
					time: ((performance.now() - startTime) / 1000).toFixed(2),
				};
			}

			// JSON request - default (no else needed since previous block returns)
			const response = await fetch(`/v1/${config.slug}/${path}`, {
				method: method.toUpperCase(),
				body: JSON.stringify(data),
				headers: { "Content-Type": "application/json" },
			});

			const json = await response.json();
			setResponse(json);
			return {
				data: json,
				time: ((performance.now() - startTime) / 1000).toFixed(2),
			};
		} catch (error) {
			console.error(error);
			toast.error("Something's gone wrong. Please try again or contact us.");
		}
	};

	if (!selectedEndpoint) return <div>Loading...</div>;

	const apiConfig = config.api[selectedEndpoint];
	const inputFields = Object.entries(apiConfig.input.parameters).map(
		([id, config]) => ({
			id,
			type: config.type,
			name:
				config.name ??
				id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " "),
			required: config.required,
			description: config.description,
			blur: config?.blur ?? false,
		}),
	) as InputField[];

	// Create output fields from config
	const outputFields: OutputField[] = Object.entries(
		apiConfig.output?.parameters ?? {},
	).map(([id, config]) => {
		// Determine the type based on config type and id
		let type: OutputField["type"] = "unknown";

		if (config.type === "string") {
			// Check if it's likely an image parameter
			const isImageByName = id.toLowerCase().includes("image");
			const isDataUrl = response?.[id]?.startsWith?.("data:image/");
			const isHttpImage =
				response?.[id]?.startsWith?.("http") &&
				/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/.test(response?.[id] ?? "");

			// Check for base64 encoded image data (even without data:image prefix)
			const maybeBase64 =
				typeof response?.[id] === "string" &&
				(response?.[id]?.match(
					/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/,
				) ||
					response?.[id]?.startsWith("iVBOR") || // PNG header
					response?.[id]?.startsWith("/9j/") || // JPEG header
					response?.[id]?.startsWith("R0lGOD")); // GIF header

			if (isImageByName || isDataUrl || isHttpImage || maybeBase64) {
				type = "image";
			}
			// Check if it's likely a video parameter
			else if (
				id.toLowerCase().includes("video") ||
				id.toLowerCase().includes("mp4") ||
				id.toLowerCase().includes("webm") ||
				response?.[id]?.startsWith?.("data:video/") ||
				(response?.[id]?.startsWith?.("http") &&
					/\.(mp4|webm|mov|avi)($|\?)/.test(response?.[id] ?? ""))
			) {
				type = "video";
			} else {
				type = "string";
			}
		} else {
			type = (config.type as OutputField["type"]) ?? "unknown";
		}

		return {
			id,
			type,
			name:
				config.name ??
				id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " "),
			description: config.description,
			required: config.required,
			blur: config?.blur ?? false,
		};
	});

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<div>
				<Inputs
					inputs={inputFields}
					handleSubmit={handleSubmit}
					endpoint={selectedEndpoint}
					setEndpoint={setSelectedEndpoint}
					endpoints={endpoints}
				/>
			</div>
			<div className="col-span-1 max-w-full">
				<Output output={response} config={outputFields} />
			</div>
		</div>
	);
}

export function Inputs({
	inputs,
	handleSubmit = async () => {},
	endpoint,
	setEndpoint,
	endpoints,
}: Readonly<{
	inputs: InputField[];
	handleSubmit?: (data: any) => Promise<any>;
	endpoint: ApiPath;
	setEndpoint: (endpoint: ApiPath) => void;
	endpoints: ApiPath[];
}>) {
	const [canBlur, setCanBlur] = useState<string[]>([]);
	const [isBlurred, setIsBlurred] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [inputForm, setInputForm] = useState<any>({});
	const [responseTime, setResponseTime] = useState<string | null>(null);

	const handleInputChange = useCallback((id: string, value: any) => {
		setInputForm((prev: any) => ({ ...prev, [id]: value }));
	}, []);

	const toggleBlur = useCallback(() => {
		setIsBlurred((prev) => !prev);
	}, []);

	const imageRef = useEventListener("click", () => {
		if (canBlur.length > 0) {
			toggleBlur();
		}
	});

	useEffect(() => {
		// Find inputs with blur parameter set to true
		const blurInputs = inputs.filter(
			(input: InputField) => input.blur === true,
		);
		setCanBlur(blurInputs.map((input) => input.id));
		// Initialize blur state if there are blurrable inputs
		setIsBlurred(blurInputs.length > 0);
	}, [inputs]);

	useEffect(() => {
		return () => {
			for (const value of Object.values(inputForm) as unknown as any[]) {
				if (value?.fileUrl) {
					URL.revokeObjectURL(value.fileUrl);
				}
			}
		};
	}, [inputForm]);

	const onSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setIsLoading(true);
			const response = await handleSubmit(inputForm);
			setResponseTime(response?.time ?? null);
			setIsLoading(false);
		},
		[handleSubmit, inputForm],
	);

	return (
		<form onSubmit={onSubmit}>
			<Fieldset>
				<Legend>Inputs</Legend>
				<Text>Fill in the inputs below to use the API.</Text>
				<FieldGroup>
					{endpoints.length > 1 && (
						<Field>
							<Label>Endpoint</Label>
							<Description>
								Select the endpoint you want to use from this API.
							</Description>
							<Listbox
								value={endpoint ?? ""}
								onChange={(value) => setEndpoint(value as ApiPath)}
								aria-label="Select endpoint"
							>
								{endpoints.map((endpointOption) => (
									<ListboxOption key={endpointOption} value={endpointOption}>
										<ListboxLabel>{endpointOption}</ListboxLabel>
									</ListboxOption>
								))}
							</Listbox>
						</Field>
					)}
					{inputs.map((input: InputField) => {
						const fileType = input.type;

						// Render boolean as checkbox
						if (fileType === "boolean") {
							return (
								<Field key={input.id}>
									<Label>
										{input.name} <Code className="ml-2">{input.id}</Code>
									</Label>
									{input.description && (
										<Description>{input.description}</Description>
									)}
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id={input.id}
											name={input.id}
											checked={inputForm[input.id] ?? false}
											onChange={(e) => {
												handleInputChange(input.id, e.target.checked);
											}}
											className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
										/>
										<Label htmlFor={input.id}>Enabled</Label>
									</div>
								</Field>
							);
						}

						// Special handling for file inputs with image preview
						if (fileType === "file") {
							return (
								<Field key={input.id} className="overflow-x-hidden">
									<Label>
										{input.name} <Code className="ml-2">{input.id}</Code>
									</Label>
									{input.description && (
										<Description>{input.description}</Description>
									)}
									<div className="p-2 rounded-lg border bg-white my-2">
										<div ref={imageRef}>
											{inputForm[input.id]?.fileUrl && (
												<Image
													src={inputForm[input.id].fileUrl}
													alt={input.name}
													width={100}
													height={100}
													className={clsx(
														"object-contain w-full h-96 rounded-md",
														inputForm[input.id]?.fileUrl ? "" : "hidden",
														canBlur.includes(input.id) && isBlurred
															? "blur-lg"
															: "",
													)}
													unoptimized
												/>
											)}
										</div>
										<div
											className={clsx(
												"flex items-center justify-center min-h-24",
												inputForm[input.id]?.fileUrl ? "hidden" : "",
											)}
										>
											<Text>Preview</Text>
										</div>
									</div>
									<Input
										name={input.id}
										required={input.required}
										type="file"
										onChange={(e) => {
											const file = e.target.files?.[0] ?? null;
											const fileUrl = file ? URL.createObjectURL(file) : null;

											// Clean up the old URL
											if (inputForm[input.id]?.fileUrl) {
												URL.revokeObjectURL(inputForm[input.id].fileUrl);
											}

											handleInputChange(input.id, { file, fileUrl });
										}}
									/>
									{canBlur.includes(input.id) && (
										<div className="text-xs mt-1 text-gray-500">
											{input.blur ? "Click the image to toggle blur" : ""}
										</div>
									)}
								</Field>
							);
						}

						// Standard inputs (text, number)
						return (
							<Field key={input.id}>
								<Label>
									{input.name} <Code className="ml-2">{input.id}</Code>
								</Label>
								{input.description && (
									<Description>{input.description}</Description>
								)}
								<div
									className={clsx(
										canBlur.includes(input.id) && isBlurred ? "blur-lg" : "",
									)}
								>
									<Input
										name={input.id}
										required={input.required}
										type={fileType === "string" ? "text" : "number"}
										value={inputForm[input.id] ?? ""}
										onChange={(e) => {
											handleInputChange(input.id, e.target.value);
										}}
									/>
								</div>
								{canBlur.includes(input.id) && (
									<div className="text-xs mt-1 text-gray-500">
										{input.blur ? "Click the image to toggle blur" : ""}
									</div>
								)}
							</Field>
						);
					})}
					<Field>
						<div className="flex flex-col md:flex-row gap-4 md:items-center">
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full md:w-auto"
							>
								{isLoading ? "Pending..." : "Make API Request"}
							</Button>
							{responseTime && <Text>Time Taken: {responseTime}s</Text>}
						</div>
					</Field>
				</FieldGroup>
			</Fieldset>
		</form>
	);
}

export function Output({
	output,
	config,
}: { readonly output: any; readonly config?: OutputField[] }) {
	const [canBlur, setCanBlur] = useState<string[]>([]);
	const [isBlurred, setIsBlurred] = useState(false);

	const toggleBlur = useCallback(() => {
		setIsBlurred((prev) => !prev);
	}, []);

	const outputImageRef = useEventListener("click", () => {
		if (canBlur?.length > 0) {
			toggleBlur();
		}
	});

	useEffect(() => {
		// Find config items with blur parameter set to true
		const blurOutputs = config?.filter((output) => output.blur === true) ?? [];
		setCanBlur(blurOutputs.map((output) => output.id));
		// Initialize blur state if there are blurrable outputs
		setIsBlurred(blurOutputs.length > 0);
	}, [config]);

	// Additional helper function to check if a string is a valid base64
	const isValidBase64 = useCallback((str: string) => {
		try {
			// Check if it's a valid base64 string
			return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(
				str,
			);
		} catch (e) {
			return false;
		}
	}, []);

	return (
		<div className="flex flex-col gap-2 col-span-1 max-w-full overflow-x-hidden">
			<Fieldset>
				<Legend>Outputs</Legend>
				<Text>The response from the API.</Text>
				<FieldGroup className="max-w-full">
					{config?.map((configOutput: OutputField) => {
						const id = configOutput.id;
						const type = configOutput.type;
						const value = output?.[id];

						// If no output yet, still render placeholders
						if (value === undefined && output !== null) return null;

						if (type === "image") {
							// Format the image source properly
							let imgSrc = value;

							// Detect if it's a base64 image without proper prefix
							if (
								typeof value === "string" &&
								!value.startsWith("data:") &&
								!value.startsWith("http")
							) {
								// Try to detect image type from common base64 headers
								let imageType = "image/jpeg"; // default
								if (value.startsWith("iVBOR")) {
									imageType = "image/png";
								} else if (value.startsWith("R0lGOD")) {
									imageType = "image/gif";
								} else if (value.startsWith("PHN2Z")) {
									imageType = "image/svg+xml";
								} else if (isValidBase64(value)) {
									// It's a base64 string but we couldn't detect the type
									imageType = "image/jpeg"; // try as jpeg
								}
								imgSrc = `data:${imageType};base64,${value}`;
							}

							return (
								<Field key={id}>
									<Label>
										{configOutput.name} <Code className="ml-2">{id}</Code>
									</Label>
									{configOutput.description && (
										<Description>{configOutput.description}</Description>
									)}
									<div className="p-2 rounded-lg border bg-white my-2">
										<div
											ref={canBlur?.includes(id) ? outputImageRef : undefined}
										>
											{value && (
												<Image
													src={imgSrc ?? ""}
													alt={configOutput.name ?? "Output Image"}
													width={100}
													height={100}
													className={clsx(
														"object-contain w-full h-96 rounded-md",
														canBlur?.includes(id) && isBlurred ? "blur-lg" : "",
													)}
													unoptimized
												/>
											)}
										</div>
										{!value && (
											<div className="flex items-center justify-center min-h-24">
												<Text>
													{output
														? "No image available"
														: "Image will appear here"}
												</Text>
											</div>
										)}
									</div>
									{canBlur?.includes(id) && (
										<div className="text-xs mt-1 text-gray-500">
											{configOutput.blur
												? "Click the image to toggle blur"
												: ""}
										</div>
									)}
								</Field>
							);
						}

						if (type === "video") {
							return (
								<Field key={id}>
									<Label>
										{configOutput.name} <Code className="ml-2">{id}</Code>
									</Label>
									{configOutput.description && (
										<Description>{configOutput.description}</Description>
									)}

									<div className="p-2 rounded-lg border bg-white my-2">
										<div
											ref={canBlur?.includes(id) ? outputImageRef : undefined}
										>
											{value ? (
												<video
													src={value}
													className={clsx(
														"object-contain w-full h-96 rounded-md",
														canBlur?.includes(id) && isBlurred ? "blur-lg" : "",
													)}
													controls
												>
													<track kind="captions" src="" label="Captions" />
												</video>
											) : (
												<div className="flex items-center justify-center min-h-24">
													<Text>
														{output
															? "No video available"
															: "Video will appear here"}
													</Text>
												</div>
											)}
										</div>
									</div>
									{canBlur?.includes(id) && (
										<div className="text-xs mt-1 text-gray-500">
											{configOutput.blur
												? "Click the video to toggle blur"
												: ""}
										</div>
									)}
								</Field>
							);
						}

						return null;
					})}
					{/* TODO: Make this field max size equivalent to the output fields */}
					<Field className="max-w-2xl overflow-x-hidden">
						<Label>
							Raw API Output
							<Code className="ml-2">json</Code>
						</Label>
						<Description>The complete JSON output from the API.</Description>
						<div className="prose prose-zinc overflow-x-auto text-xs w-full mt-2">
							<Markdown>{`\`\`\`json\n${JSON.stringify(output ?? {}, null, 2)}\n\`\`\``}</Markdown>
						</div>
					</Field>
				</FieldGroup>
			</Fieldset>
		</div>
	);
}

export function DocsButton({ docs }: { readonly docs: any }) {
	const [docsOpen, setDocsOpen] = useState(false);

	const closeDocs = useCallback(() => {
		setDocsOpen(false);
	}, []);

	const openDocs = useCallback(() => {
		setDocsOpen(true);
	}, []);

	return (
		<div>
			<Button
				type="button"
				onClick={openDocs}
				outline
				className="w-full md:w-auto"
			>
				View Documentation
			</Button>
			<Dialog open={docsOpen} onClose={closeDocs} size="5xl">
				<div className="mt-6">
					<div className="prose prose-zinc">
						<Markdown>{docs}</Markdown>
					</div>
				</div>
				<div className="mt-8 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:flex-row sm:*:w-auto">
					<Button color="dark" onClick={closeDocs}>
						Close Documentation
					</Button>
				</div>
			</Dialog>
		</div>
	);
}
