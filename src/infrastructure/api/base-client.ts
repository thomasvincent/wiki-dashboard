/**
 * Base API Client
 * Reusable HTTP client with rate limiting, retry logic, and error handling
 * Serves as foundation for Wikipedia and other API clients
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// === Types ===

export interface ApiClientConfig {
  /** Base URL for API requests */
  baseURL: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** User-Agent header value */
  userAgent?: string;
  /** Default params to include with every request */
  defaultParams?: Record<string, string | number>;
  /** Minimum time between requests in milliseconds (rate limiting) */
  minRequestInterval?: number;
  /** Maximum retry attempts for failed requests */
  maxRetries?: number;
  /** Initial backoff time in milliseconds for retries */
  initialBackoffMs?: number;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: Record<string, string>;
}

export interface ApiError {
  readonly message: string;
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly isRetryable: boolean;
}

type RequestInterceptor = (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
type ErrorInterceptor = (error: AxiosError) => Promise<never>;

// === Base Client ===

export class BaseApiClient {
  protected readonly client: AxiosInstance;
  private lastRequestTime = 0;
  private readonly minRequestInterval: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;

  constructor(config: ApiClientConfig) {
    this.minRequestInterval = config.minRequestInterval ?? 200;
    this.maxRetries = config.maxRetries ?? 3;
    this.initialBackoffMs = config.initialBackoffMs ?? 1000;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30_000,
      headers: {
        'User-Agent': config.userAgent ?? 'BaseApiClient/1.0',
      },
      params: config.defaultParams,
    });
  }

  /**
   * Add request interceptor for modifying outgoing requests
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.client.interceptors.request.use(interceptor);
  }

  /**
   * Add response interceptor for processing responses
   */
  addResponseInterceptor(onFulfilled: ResponseInterceptor, onRejected?: ErrorInterceptor): void {
    this.client.interceptors.response.use(onFulfilled, onRejected);
  }

  /**
   * Rate limiting - ensures minimum time between requests
   */
  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await this.sleep(this.minRequestInterval - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep utility for delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable
   */
  protected isRetryableError(error: AxiosError): boolean {
    // Network errors are retryable
    if (!error.response) return true;

    // Rate limiting (429) and server errors (5xx) are retryable
    const status = error.response.status;
    return status === 429 || (status >= 500 && status < 600);
  }

  /**
   * Calculate backoff delay for retry attempts
   */
  protected getBackoffDelay(attempt: number, error?: AxiosError): number {
    let delay = this.initialBackoffMs * Math.pow(2, attempt);

    // Check for Retry-After header
    if (error?.response?.headers?.['retry-after']) {
      const retryAfter = parseInt(error.response.headers['retry-after'], 10);
      if (!isNaN(retryAfter)) {
        delay = retryAfter * 1000;
      }
    }

    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Create standardized API error
   */
  protected createApiError(error: AxiosError): ApiError {
    return {
      message: error.message,
      status: error.response?.status,
      code: error.code,
      isRetryable: this.isRetryableError(error),
    };
  }

  /**
   * Execute request with retry logic
   */
  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    customMaxRetries?: number
  ): Promise<T> {
    const maxAttempts = customMaxRetries ?? this.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.rateLimit();
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof AxiosError) {
          // Don't retry non-retryable errors
          if (!this.isRetryableError(error)) {
            throw error;
          }

          // Calculate delay with backoff
          const delay = this.getBackoffDelay(attempt, error);

          if (attempt < maxAttempts - 1) {
            await this.sleep(delay);
          }
        } else if (attempt < maxAttempts - 1) {
          await this.sleep(this.initialBackoffMs * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  /**
   * GET request with automatic retry
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.get(endpoint, {
        params: this.cleanParams(params),
      });
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    });
  }

  /**
   * POST request with automatic retry
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.post(endpoint, data, {
        params: this.cleanParams(params),
      });
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    });
  }

  /**
   * PUT request with automatic retry
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.put(endpoint, data, {
        params: this.cleanParams(params),
      });
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    });
  }

  /**
   * DELETE request with automatic retry
   */
  async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.delete(endpoint, {
        params: this.cleanParams(params),
      });
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    });
  }

  /**
   * Remove undefined values from params object
   */
  private cleanParams(
    params?: Record<string, string | number | boolean | undefined>
  ): Record<string, string | number | boolean> | undefined {
    if (!params) return undefined;

    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number | boolean>;
  }
}

// === Factory Function ===

export function createApiClient(config: ApiClientConfig): BaseApiClient {
  return new BaseApiClient(config);
}

export default BaseApiClient;
