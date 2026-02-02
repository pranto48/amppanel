import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TwoFASetupData {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
}

export const use2FA = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("totp", {
        body: { action: "status" },
      });
      
      if (error) throw error;
      return data.enabled as boolean;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setup = useCallback(async (): Promise<TwoFASetupData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("totp", {
        body: { action: "setup" },
      });
      
      if (error) throw error;
      return data as TwoFASetupData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("totp", {
        body: { action: "verify", code },
      });
      
      if (error) throw error;
      return data.valid || data.success;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validate = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("totp", {
        body: { action: "validate", code },
      });
      
      if (error) throw error;
      return data.valid;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disable = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("totp", {
        body: { action: "disable", code },
      });
      
      if (error) throw error;
      return data.success;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getStatus,
    setup,
    verify,
    validate,
    disable,
  };
};
