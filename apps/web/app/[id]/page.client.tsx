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
  type: "image" | "video";
  name?: string;
  blur?: boolean;
  description?: string;
}

export function Playground({
  config,
}: {
  config: Config;
}) {
  const [response, setResponse] = useState<any>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiPath | null>(null);
  const endpoints = Object.keys(config.api) as ApiPath[];

  useEffect(() => {
    if (endpoints.length > 0 && !selectedEndpoint) {
      setSelectedEndpoint(endpoints[0]);
    }
  }, [endpoints, selectedEndpoint]);

  const handleSubmit = async (data: any) => {
    if (!selectedEndpoint) return;
    
    const apiConfig = config.api[selectedEndpoint];
    const contentType = apiConfig.input.type;
    const formData = new FormData();
    const [method, path] = selectedEndpoint.slice(1).split('/');

    if (contentType === "formdata") {
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

      const response = await fetch(`/v1/${config.slug}/${path}`, {
        method: method.toUpperCase(),
        body: contentType === "formdata" ? formData : JSON.stringify(data),
        headers:
          contentType === "formdata"
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
      toast.error("Something's gone wrong. Please try again or contact us.");
    }
  };

  if (!selectedEndpoint) return <div>Loading...</div>;

  const apiConfig = config.api[selectedEndpoint];
  const inputFields = Object.entries(apiConfig.input.parameters).map(([id, config]) => ({
    id,
    type: config.type,
    name: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
    required: config.required,
  })) as InputField[];

  // Manually define outputs for demo
  const outputFields: OutputField[] = Object.keys(response ?? {}).filter(key => {
    const value = response[key];
    return typeof value === 'string' && (
      value.startsWith('http') && (
        value.endsWith('.png') || 
        value.endsWith('.jpg') || 
        value.endsWith('.jpeg') || 
        value.endsWith('.gif') ||
        value.endsWith('.mp4') ||
        value.endsWith('.webm') ||
        value.endsWith('.mov')
      )
    );
  }).map(id => ({
    id,
    type: id.endsWith('.mp4') || id.endsWith('.webm') || id.endsWith('.mov') ? 'video' : 'image',
    name: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <Fieldset>
          <Legend>Endpoint</Legend>
          <Text>Select an endpoint to use from this API.</Text>
          <FieldGroup>
            <Field>
              <select 
                className="block w-full rounded-md border border-zinc-950/10 bg-white px-3 py-2 shadow-sm text-base/6 text-zinc-950 sm:text-sm/6 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
                value={selectedEndpoint ?? ''}
                onChange={(e) => setSelectedEndpoint(e.target.value as ApiPath)}
              >
                {endpoints.map((endpoint) => (
                  <option key={endpoint} value={endpoint}>
                    {endpoint}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>
        </Fieldset>
        <Inputs inputs={inputFields} handleSubmit={handleSubmit} />
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
}: Readonly<{
  inputs: InputField[];
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
    const blurInputs = inputs.filter((input: InputField) => input.blur);
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
                <Field key={input.id}>
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
                            isBlurred ? "blur-lg" : "",
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
                      const fileUrl = file
                        ? URL.createObjectURL(file)
                        : null;

                      // Clean up the old URL
                      if (inputForm[input.id]?.fileUrl) {
                        URL.revokeObjectURL(inputForm[input.id].fileUrl);
                      }

                      handleInputChange(input.id, { file, fileUrl });
                    }}
                  />
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
                <Input
                  name={input.id}
                  required={input.required}
                  type={fileType === "string" ? "text" : "number"}
                  value={inputForm[input.id] ?? ""}
                  onChange={(e) => {
                    handleInputChange(input.id, e.target.value);
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
    const blurInputs =
      config?.filter((output: OutputField) => output.blur) ?? [];
    setIsBlurred(blurInputs.length > 0);
    setCanBlur(blurInputs.map((output: OutputField) => output.id));
  }, [config]);

  return (
    <div className="flex flex-col gap-2 col-span-1 max-w-full">
      <Fieldset>
        <Legend>Outputs</Legend>
        <Text>The response from the API.</Text>
        <FieldGroup className="max-w-full">
          {config?.map((configOutput: OutputField) => {
            const id = configOutput.id;
            const type = configOutput.type;

            if (type === "image") {
              return (
                <Field key={id}>
                  <Label>
                    {configOutput.name ?? id}{" "}
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
                    {configOutput.name ?? id}{" "}
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
                        output?.[id] ? "" : "hidden",
                      )}
                      controls
                    >
                      <track kind="captions" src="" label="Captions" />
                    </video>
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
        <div className="prose prose-zinc overflow-x-auto text-xs w-full mt-2">
          <Markdown>{`\`\`\`json\n${JSON.stringify(output ?? {}, null, 2)}\n\`\`\``}</Markdown>
        </div>
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
