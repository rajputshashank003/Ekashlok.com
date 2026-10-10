import { METHODS } from "../constants";
import utils from "./utils";

export const emailApi = {
  unsubscribeByToken: (email: string, token: string, action: "unsubscribe" | "subscribe" = "unsubscribe") =>
    utils.request({
      url: "/users/unsubscribe-email",
      method: METHODS.POST,
      data: { email, token, action },
    }),

  toggleEmailSubscription: (subscribed: boolean) =>
    utils.request({
      url: "/users/email-subscription",
      method: METHODS.PATCH,
      data: { subscribed },
    }),
};
