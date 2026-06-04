import { METHODS } from "../constants";
import utils from "./utils";

export const waApi = {
  sendOTP: (phone: string) =>
    utils.request({
      url: "/wa/send-otp",
      method: METHODS.POST,
      data: { phone },
    }),

  verifyOTP: (phone: string, code: string) =>
    utils.request({
      url: "/wa/verify-otp",
      method: METHODS.POST,
      data: { phone, code },
    }),

  subscribe: (start_choice: string, custom_count?: number) =>
    utils.request({
      url: "/wa/subscribe",
      method: METHODS.POST,
      data: { start_choice, custom_count },
    }),

  unsubscribe: () =>
    utils.request({ url: "/wa/unsubscribe", method: METHODS.POST }),
};
