import { getConfig } from "@/utils/get-config";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, {
  params,
}: Readonly<{
  params: Promise<{
    id: string;
  }>;
}>) {
  const { id } = await params;

  const configFiles = await getConfig();

  const config = configFiles.find((config) => config.slug === id);

  if (!config) {
    return NextResponse.json({
      error: "This provider does not exist.",
      hint: "Check the docs at https://request.directory",
    }, {
      status: 400,
    });
  }

  // This is a health check endpoint for the provider

  return NextResponse.json({
    status: "ok",
    name: config.name,
    docs: `https://request.directory/${config.name}`,
  });
}
