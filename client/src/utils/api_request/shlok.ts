import { METHODS } from "../constants";
import utils from "./utils";

export const shlokApi = {
  getTodayShlok: () =>
    utils.request({ url: "/shlok/today", method: METHODS.GET }),

  resetShlokCount: () =>
    utils.request({ url: "/shlok/reset", method: METHODS.POST }),

  getChapters: () =>
    utils.request({ url: "/shloks", method: METHODS.GET, show_error: false }),

  getChapterVerses: (chapter: number) =>
    utils.request({
      url: `/shloks/${chapter}`,
      method: METHODS.GET,
      show_error: false,
    }),

  getVerse: (chapter: number, verse: number) =>
    utils.request({
      url: `/shloks/${chapter}/${verse}`,
      method: METHODS.GET,
      show_error: false,
    }),

  getMe: () =>
    utils.request({ url: "/users/me", method: METHODS.GET }),
};
