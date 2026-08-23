import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * Restrict a route to specific roles.
 * Usage: router.post("/", requireAuth, authorize("ADMIN", "AGENT"), handler)
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}
