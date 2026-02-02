import { createContext, useContext, ReactNode } from "react";
import { useBackupNotifications } from "@/hooks/useBackupNotifications";

type NotificationContextType = ReturnType<typeof useBackupNotifications>;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const notifications = useBackupNotifications();
  
  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
