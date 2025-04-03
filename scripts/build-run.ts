#!/usr/bin/env bun
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { existsSync } from "node:fs";

const execAsync = promisify(exec);

async function checkAndKillProcessOnPort(port: number): Promise<void> {
	try {
		const { stdout } = await execAsync(
			`docker ps --format '{{.ID}}' -f "publish=${port}"`,
		);
		const containerId = stdout.trim();

		if (containerId) {
			console.log(
				`Found Docker container ${containerId} using port ${port}. Stopping it...`,
			);
			await execAsync(`docker stop ${containerId}`);
			console.log(`Docker container ${containerId} stopped.`);
		} else {
			console.log(`No Docker container found using port ${port}.`);
		}
	} catch (error) {
		console.log(
			`Error checking for Docker containers on port ${port}: ${error}`,
		);
	}
}

// Function to load environment variables from .env file
async function loadEnvFile(filePath: string): Promise<string[]> {
	if (!existsSync(filePath)) {
		console.log(`No .env file found at ${filePath}, skipping env variables.`);
		return [];
	}

	const envContent = await readFile(filePath, "utf-8");
	const envVars: string[] = [];

	const lines = envContent.split("\n");
	for (const line of lines) {
		// Skip empty lines or comments
		if (!line.trim() || line.startsWith("#")) continue;

		// Get "KEY=VALUE" pairs
		const match = line.match(/^([^=]+)=(.*)$/);
		if (match) {
			const key = match[1].trim();
			const value = match[2].trim();
			envVars.push(`--env ${key}=${value}`);
		}
	}

	return envVars;
}

async function buildAndRun() {
	try {
		// Get package name from command line arguments
		const packageName = process.argv[2];

		if (!packageName) {
			console.error("Please provide a package name as an argument");
			process.exit(1);
		}

		const packagePath = join(process.cwd(), "packages", packageName);

		// Read config.json for the package
		const configPath = join(packagePath, "config.json");
		const configContent = await readFile(configPath, "utf-8");
		const config = JSON.parse(configContent);

		console.log(`Building and running package: ${config.name}`);
		const port = config.port ?? 8000;
		console.log(`Port: ${port}`);

		// Build Docker image
		console.log("\nBuilding Docker image...");
		const buildCommand = `cd packages/${packageName} && docker build -t ${config.slug} .`;
		const { stdout: buildOutput } = await execAsync(buildCommand);
		console.log(buildOutput);

		// Check and kill any process using the port
		await checkAndKillProcessOnPort(port);

		// Load environment variables from .env file
		const envFilePath = join(packagePath, ".env");
		const envVars = await loadEnvFile(envFilePath);
		const envString = envVars.join(" ");

		// Run Docker container with env vars
		console.log("\nRunning Docker container...");
		const runCommand = `docker run --rm -p ${port}:${port} ${envString} ${config.slug}`;

		// This won't return until the container is stopped
		console.log(`Executing: ${runCommand}`);
		const dockerProcess = exec(runCommand);

		// Pipe output to console
		dockerProcess.stdout?.pipe(process.stdout);
		dockerProcess.stderr?.pipe(process.stderr);

		// Handle container exit
		dockerProcess.on("exit", (code) => {
			console.log(`Docker container exited with code ${code}`);
			process.exit(code ?? 0);
		});

		// Handle script interruption
		process.on("SIGINT", () => {
			console.log("\nInterrupted. Stopping Docker container...");
			dockerProcess.kill("SIGINT");
		});
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

buildAndRun();
