import "@/utils/env/load";

/**
 * Get an environment variable with optional default value and required check
 *
 * @param name - The name of the environment variable
 * @param options - Options object with required and default properties
 * @returns The environment variable value or default value if provided
 */
export const env = (name: string, options: {
  required?: boolean;
  default?: string;
} = {
  required: true,
  default: undefined,
}) => {
  const value = process.env?.[name];

  if (!value && options?.default) {
    return options.default;
  }

  if (!value && options?.required) {
    throw new Error(`Environment variable ${name} is not set.`);
  }

  return value;
};
