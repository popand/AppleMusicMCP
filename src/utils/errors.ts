export interface AppleMusicErrorDetail {
  id: string;
  title: string;
  detail: string;
  status: string;
  code: string;
}

export class AppleMusicApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: AppleMusicErrorDetail[]
  ) {
    super(message);
    this.name = "AppleMusicApiError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends Error {
  constructor(public retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function formatError(error: unknown): {
  content: { type: "text"; text: string }[];
  isError: true;
} {
  let message: string;

  if (error instanceof AuthenticationError) {
    message = `Authentication Error: ${error.message}`;
  } else if (error instanceof AppleMusicApiError) {
    message = `Apple Music API Error (${error.statusCode}): ${error.message}`;
    if (error.errors?.length) {
      message +=
        "\nDetails:\n" +
        error.errors.map((e) => `  - ${e.title}: ${e.detail}`).join("\n");
    }
  } else if (error instanceof ConfigurationError) {
    message = `Configuration Error: ${error.message}`;
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Unknown error: ${String(error)}`;
  }

  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
