// api.ts

import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Retry config ────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [1000, 2000, 4000]; // exponential back-off

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

declare module "axios" {
  export interface AxiosRequestConfig {
    requiresAuth?: boolean;
    _retryCount?: number;   // internal retry counter
  }
}



// ==============================
// BASE URL
// ==============================

const BASE_URL = "http://localhost:3000/";
// const BASE_URL = "http://10.0.2.2:3000/";
// const BASE_URL = "https://server.vydhyo.com/";

// ==============================
// AXIOS INSTANCE
// ==============================

const httpClient = axios.create({
  baseURL: BASE_URL,

  headers: {
    deviceType: "Mobile",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ==============================
// REQUEST INTERCEPTOR
// ==============================

httpClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Add Token
      if (config.requiresAuth) {
        const token = await AsyncStorage.getItem("authToken");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Handle FormData
      if (config.data instanceof FormData) {
        config.headers["Content-Type"] =
          "multipart/form-data";
      }

      console.log(
        "API REQUEST =>",
        `${config.baseURL}${config.url}`
      );

      console.log("REQUEST DATA =>", config.data);

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);
// ==============================
// RESPONSE INTERCEPTOR
// ==============================

httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("API RESPONSE =>", response.data);

    return response;
  },
  async (error: AxiosError<any>) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };

    // Only retry on genuine network failures (no response from server)
    // Do NOT retry on 4xx / 5xx — those are intentional server responses.
    const isNetworkError = !error.response && !!error.request;

    if (isNetworkError && config && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;

      const delayMs = RETRY_DELAY_MS[config._retryCount - 1] ?? 4000;
      console.log(
        `[Network] Retry ${config._retryCount}/${MAX_RETRIES} in ${delayMs / 1000}s — ${config.url}`,
      );

      await sleep(delayMs);
      return httpClient(config);
    }

    console.log("API ERROR =>", error);
    return Promise.reject(handleError(error));
  }
);

// ==============================
// COMMON ERROR HANDLER
// ==============================

const handleError = (err: any) => {
  console.error("API Error:", err);

  if (err?.response?.data?.message) {
    const message = err.response.data.message;

    return {
      message:
        typeof message === "string"
          ? message
          : message?.message ||
            "Something went wrong",

      status: "error",
    };
  }

  if (err?.response?.data?.error) {
    const error = err.response.data.error;

    return {
      message:
        typeof error === "string"
          ? error
          : JSON.stringify(error),

      status: "error",
    };
  }

  return {
    message: "Something went wrong",
    status: "error",
  };
};

// ==============================
// COMMON API REQUEST FUNCTION
// ==============================

interface ApiRequestParams {
  url: string;
  method?: "get" | "post" | "put" | "delete" | "patch";
  data?: any;
  requiresAuth?: boolean;
  contentType?: string;
}

export async function apiRequest({
  url,
  method = "get",
  data = null,
  requiresAuth = false,
  contentType = "application/json",
}: ApiRequestParams) {
  try {
    const response = await httpClient({
      url,
      method,
      data,
      requiresAuth,

      headers: {
        "Content-Type": contentType,
      },
    });

    return {
      data: response.data,
      status: "success",
    };
  } catch (err: any) {
    return err;
  }
}

export default httpClient;