import { useEffect, useState } from "react";
import { getCurrentUserRole } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUserRole().then((r) => {
      setRole(r);
      setLoading(false);
    });
  }, []);

  return { role, isOperator: role === "operator", isTracker: role === "tracker", loading };
}
