import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";

const NetworkBanner = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      toast.success("You're back online.");
      const timer = setTimeout(() => setShowBackOnline(false), 2000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  if (isOnline && !showBackOnline) return null;

  return (
    <div className={`network-banner ${showBackOnline ? "online" : "offline"}`}>
      {showBackOnline ? "You're back online." : "You are offline. Check your connection."}
    </div>
  );
};

export default NetworkBanner;
