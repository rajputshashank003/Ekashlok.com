import { METHODS } from "../constants";
import utils from "./utils";

export const authApi = {
  verifyGoogleToken: (credential: string) =>
    utils.request({
      url: `/auth/google`,
      method: METHODS.POST,
      data: { credential },
    }),
};
