import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { maintenanceApi } from "../utils/api_request/maintenance";

interface MaintenanceState {
  otpMaintenance: boolean;
  dispatchMaintenance: boolean;
  loading: boolean;
  refresh: () => void;
}

const MaintenanceContext = createContext<MaintenanceState>({
  otpMaintenance: false,
  dispatchMaintenance: false,
  loading: true,
  refresh: () => {},
});

export const useMaintenance = () => useContext(MaintenanceContext);

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [otpMaintenance, setOtpMaintenance] = useState(false);
  const [dispatchMaintenance, setDispatchMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    maintenanceApi
      .getPublicSettings()
      .then((data) => {
        setOtpMaintenance(data.otp_maintenance ?? false);
        setDispatchMaintenance(data.dispatch_maintenance ?? false);
      })
      .catch(() => {
        // Non-fatal: if fetch fails, default to no maintenance (safe default)
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    // Re-poll every 60 s so banners appear without a full page refresh
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MaintenanceContext.Provider
      value={{ otpMaintenance, dispatchMaintenance, loading, refresh: fetch }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};
