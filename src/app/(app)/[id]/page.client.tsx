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
import { Dialog, DialogActions, DialogBody } from "@/components/ui/dialog";
import Markdown from "react-markdown";

// Functions
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

// Hooks
import { useEventListener } from "@mantine/hooks";
import { toast } from "sonner";

export interface InputType {
	id: string;
	type:
		| "image"
		| "file"
		| "number"
		| "search"
		| "time"
		| "text"
		| "date"
		| "datetime-local"
		| "email"
		| "month"
		| "password"
		| "tel"
		| "url"
		| "week"
		| undefined;
	name: string;
	required?: boolean;
	description?: string;
	blur?: boolean;
}

export interface OutputType {
	id: string;
	type: "image" | "video";
	name?: string;
	blur?: boolean;
	description?: string;
}

export function Playground({
	config,
	id,
}: {
	readonly config: {
		readonly request: { method: string; type: string };
		readonly inputs: InputType[];
		readonly outputs?: OutputType[];
	};
	readonly id: string;
}) {
	const [response, setResponse] = useState<any>(null);

	const handleSubmit = async (data: any) => {
		const contentType = config.request.type;
		const formData = new FormData();

		if (contentType === "form-data") {
			// Append each field to FormData
			for (const key in data) {
				if (data[key]?.file) {
					formData.append(key, data[key].file); // Append file
				} else {
					formData.append(key, data[key]); // Append other data
				}
			}
		} else {
			// For JSON, keep the existing method
			formData.append("data", JSON.stringify(data));
		}

		try {
			const startTime = performance.now();

			const response = await fetch(`/v1/${id}`, {
				method: config.request.method,
				body: contentType === "form-data" ? formData : JSON.stringify(data),
				headers:
					contentType === "form-data"
						? undefined
						: { "Content-Type": "application/json" },
			});

			const json = await response.json();
			setResponse(json);
			return {
				data: json,
				time: ((performance.now() - startTime) / 1000).toFixed(2),
			};
		} catch (error) {
			console.error(error);
			toast.error("Something’s gone wrong. Please try again or contact us.");
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<Inputs inputs={config?.inputs} handleSubmit={handleSubmit} />
			<div className="col-span-1 max-w-full">
				<Output output={response} config={config?.outputs} />
			</div>
		</div>
	);
}

export function Inputs({
	inputs,
	handleSubmit = async () => {},
}: Readonly<{
	inputs: InputType[];
	handleSubmit?: (data: any) => Promise<any>;
}>) {
	const [canBlur, setCanBlur] = useState(false);
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
		if (canBlur) {
			toggleBlur();
		}
	});

	useEffect(() => {
		const blurInputs = inputs.filter((input: InputType) => input.blur);
		setIsBlurred(blurInputs.length > 0);
		setCanBlur(blurInputs.length > 0);
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
					{inputs.map((input: InputType) => {
						let fileType = input.type;

						if (fileType === "image") {
							fileType = "file";
						}

						return (
							<Field key={input.id}>
								<Label>
									{input.name} <Code className="ml-2">{input.id}</Code>
								</Label>
								{input.description && (
									<Description>{input.description}</Description>
								)}
								{input.type === "image" && (
									<div className="p-2 rounded-lg border bg-white my-2">
										{/* not having overflow-hidden above is quite nice with the blur effect */}
										<div ref={imageRef}>
											{inputForm[input.id]?.fileUrl && (
												<Image
													src={inputForm[input.id].fileUrl}
													alt={input.name}
													width={100}
													height={100}
													className={clsx(
														"object-contain w-full h-96 rounded-md",
														/* it's even nicer when this is h-full */
														inputForm[input.id]?.fileUrl ? "" : "hidden",
														isBlurred ? "blur-lg" : "",
													)}
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
								)}
								<Input
									name={input.id}
									required={input.required}
									type={fileType}
									value={
										input.type === "file" || input.type === "image"
											? undefined
											: inputForm[input.id]
									}
									onChange={(e) => {
										if (input.type === "file" || input.type === "image") {
											const file = e.target.files?.[0] ?? null;
											const fileUrl = file
												? encodeURI(URL.createObjectURL(file))
												: null;

											// Clean up the old URL
											if (inputForm[input.id]?.fileUrl) {
												URL.revokeObjectURL(inputForm[input.id].fileUrl);
											}

											handleInputChange(input.id, { file, fileUrl });
										} else {
											handleInputChange(input.id, e.target.value);
										}
									}}
								/>
							</Field>
						);
					})}
					<Field>
						<div className="flex flex-col md:flex-row gap-4 md:items-center">
							<Button
								type="submit"
								color="dark"
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
}: { readonly output: any; readonly config?: OutputType[] }) {
	const [canBlur, setCanBlur] = useState<string[]>([]);
	const [isBlurred, setIsBlurred] = useState(false);

	const toggleBlur = useCallback(() => {
		setIsBlurred((prev) => !prev);
	}, []);

	const outputImageRef = useEventListener("click", () => {
		if (canBlur) {
			toggleBlur();
		}
	});

	useEffect(() => {
		const blurInputs =
			config?.filter((output: OutputType) => output.blur) ?? [];
		setIsBlurred(blurInputs.length > 0);
		setCanBlur(blurInputs.map((output: OutputType) => output.id));
		console.log(blurInputs);
	}, [config]);

	return (
		<div className="flex flex-col gap-2 col-span-1 max-w-full">
			<Fieldset>
				<Legend>Outputs</Legend>
				<Text>The response from the API.</Text>
				<FieldGroup className="max-w-full">
					{config?.map((configOutput: OutputType) => {
						const id = configOutput.id;
						const type = configOutput.type;

						if (type === "image") {
							return (
								<Field key={id}>
									<Label>
										{configOutput.name}{" "}
										<Code className="ml-2">{configOutput.id}</Code>
									</Label>
									{configOutput.description && (
										<Description>{configOutput.description}</Description>
									)}
									<div className="p-2 rounded-lg border bg-white my-2">
										<div ref={outputImageRef}>
											{output?.[id] && (
												<Image
													src={output[id]}
													alt={configOutput.name ?? "Output Image"}
													width={100}
													height={100}
													className={clsx(
														"object-contain w-full h-96 rounded-md",
														output?.[id] ? "" : "hidden",
														canBlur?.includes(id) && isBlurred ? "blur-lg" : "",
													)}
													unoptimized
												/>
											)}
										</div>
										<div
											className={clsx(
												"flex items-center justify-center min-h-24",
												output?.[id] ? "hidden" : "",
											)}
										>
											<Text>Output Preview</Text>
										</div>
									</div>
								</Field>
							);
						}

						if (type === "video") {
							return (
								<Field key={id}>
									<Label>
										{configOutput.name}{" "}
										<Code className="ml-2">{configOutput.id}</Code>
									</Label>
									{configOutput.description && (
										<Description>{configOutput.description}</Description>
									)}

									<div className="p-2 rounded-lg border bg-white my-2">
										<video
											src={output?.[id]}
											className={clsx(
												"object-contain w-full h-96 rounded-md",
												output?.[id]
													? ""
													: "hidden",
											)}
											controls
										>
											<track kind="captions" src="" label="Captions" />
										</video>
										<div
											className={clsx(
												"flex items-center justify-center min-h-24",
												output?.[id]
													? "hidden"
													: "",
											)}
										>
											<Text>Output Preview</Text>
										</div>
									</div>
								</Field>
							);
						}

						return null;
					})}
				</FieldGroup>
			</Fieldset>
			<Field className="max-w-full">
				<Label>
					API Output
					<Code className="ml-2">json</Code>
				</Label>
				<Description>The JSON output from the API.</Description>
				<Markdown className="prose prose-zinc overflow-x-auto text-xs w-full mt-2">
					{`\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\``}
				</Markdown>
			</Field>
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
				<DialogBody>
					<Markdown className="prose prose-zinc">{docs}</Markdown>
				</DialogBody>
				<DialogActions>
					<Button color="dark" onClick={closeDocs}>
						Close Documentation
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
