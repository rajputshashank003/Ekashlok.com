import { METHODS } from "../constants";
import utils from "./utils";

export const adminApi = {
  getStats: () =>
    utils.request({ url: "/admin/stats", method: METHODS.GET }),

  getUsers: (page = 1, limit = 20) =>
    utils.request({
      url: `/admin/users?page=${page}&limit=${limit}`,
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

  getSignupAttempts: (page = 1, limit = 20) =>
    utils.request({
      url: `/admin/signup-attempts?page=${page}&limit=${limit}`,
      method: METHODS.GET,
    }),
};
