import { METHODS } from "../constants";
import utils from "./utils";

export const maintenanceApi = {
  /** GET /api/settings/public — no auth required */
  getPublicSettings: (): Promise<{ otp_maintenance: boolean; dispatch_maintenance: boolean }> =>
    utils.request({ url: "/settings/public", method: METHODS.GET }),
};
