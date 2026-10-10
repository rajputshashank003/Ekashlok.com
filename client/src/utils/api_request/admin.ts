import { METHODS } from "../constants";
import utils from "./utils";

export interface UserFilters {
  shlok_count_gte?: string;
  shlok_count_lte?: string;
  logged_count_gte?: string;
  logged_count_lte?: string;
  email_status?: string;
  last_login_from?: string;
  last_login_to?: string;
  created_from?: string;
  created_to?: string;
}

export interface SignupFilters {
  created_from?: string;
  created_to?: string;
}

function buildQS(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") parts.push(`${k}=${encodeURIComponent(v)}`);
  }
  return parts.length ? `&${parts.join("&")}` : "";
}

export const adminApi = {
  getStats: () =>
    utils.request({ url: "/admin/stats", method: METHODS.GET }),

  getUsers: (page = 1, limit = 20, filters: UserFilters = {}) =>
    utils.request({
      url: `/admin/users?page=${page}&limit=${limit}${buildQS(filters as Record<string, string>)}`,
      method: METHODS.GET,
    }),

  toggleAdmin: (userId: number) =>
    utils.request({
      url: `/admin/users/${userId}/toggle-admin`,
      method: METHODS.PATCH,
    }),

  getSettings: () =>
    utils.request({ url: "/admin/settings", method: METHODS.GET }),

  updateSettings: (settings: Record<string, string>) =>
    utils.request({
      url: "/admin/settings",
      method: METHODS.PATCH,
      data: settings,
    }),

  getSignupAttempts: (page = 1, limit = 20, filters: SignupFilters = {}) =>
    utils.request({
      url: `/admin/signup-attempts?page=${page}&limit=${limit}${buildQS(filters as Record<string, string>)}`,
      method: METHODS.GET,
    }),
};
