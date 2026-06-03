import type { Request, Response, NextFunction } from "express";
import { AccountService } from "./account.service";
import type { AppRole } from "~/lib/delivery/delivery.shared";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appRole?: AppRole;
    }
  }
}

/** Resolves and attaches req.appRole. Must run after requireAuth. */
export async function attachAppRole(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.user) req.appRole = await AccountService.getAppRole(req.user.id);
  } catch {
    /* ignore */
  }
  next();
}

export function requireAppRole(...roles: AppRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const role = req.appRole ?? (await AccountService.getAppRole(req.user.id));
      req.appRole = role;
      if (!roles.includes(role)) {
        res.status(403).json({ success: false, message: "Forbidden for your role" });
        return;
      }
      next();
    } catch (e: any) {
      res.status(e.statusCode ?? 500).json({ success: false, message: e.message ?? "Error" });
    }
  };
}
