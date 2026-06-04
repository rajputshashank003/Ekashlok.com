import axios, { AxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { LOCAL_STORAGE, HttpMethod } from "../constants";

export interface RequestProps extends AxiosRequestConfig {
  show_error?: boolean;
  response_array?: boolean;
  base?: string;
  method?: HttpMethod;
}

const utils = {
  request: ({
    show_error = true,
    response_array = false,
    base = import.meta.env.VITE_API_URL || "http://localhost:8081/api",
    ...config
  }: RequestProps): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        const requestConfig: AxiosRequestConfig = base
          ? { ...config, baseURL: base }
          : config;

        const token = localStorage.getItem(LOCAL_STORAGE.TOKEN);
        if (token) {
          requestConfig.headers = {
            ...requestConfig.headers,
            Authorization: `Bearer ${token}`,
          };
        }

        const res = await axios(requestConfig);

        if (response_array) return resolve(res.data);
        return resolve(res.data || {});
      } catch (error: any) {
        console.error("API Error:", error);

        // Unified 401 handling
        if (error?.response?.status === 401) {
          setTimeout(() => {
            localStorage.removeItem(LOCAL_STORAGE.TOKEN);
            localStorage.removeItem(LOCAL_STORAGE.USER);
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
          }, 500);
        }

        if (show_error) {
          const message =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Something went wrong!";
          toast.error(message);
        }

        return reject(error);
      }
    });
  },
};

export default utils;
