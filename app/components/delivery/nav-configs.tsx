import { Home, PlusCircle, Clock, Briefcase, User, LayoutGrid, Users, DollarSign, AlertTriangle } from "lucide-react";
import type { NavItem } from "./app-shell";

const ic = "size-5";

export const customerNav: NavItem[] = [
  { to: "/app", label: "Home", icon: <Home className={ic} /> },
  { to: "/app/new", label: "Send", icon: <PlusCircle className={ic} /> },
  { to: "/app/history", label: "History", icon: <Clock className={ic} /> },
];

export const courierNav: NavItem[] = [
  { to: "/courier", label: "Jobs", icon: <Briefcase className={ic} /> },
  { to: "/courier/active", label: "Active", icon: <Home className={ic} /> },
  { to: "/courier/earnings", label: "Earnings", icon: <DollarSign className={ic} /> },
  { to: "/courier/profile", label: "Profile", icon: <User className={ic} /> },
];

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: <LayoutGrid className={ic} /> },
  { to: "/admin/deliveries", label: "Live", icon: <Home className={ic} /> },
  { to: "/admin/couriers", label: "Couriers", icon: <Users className={ic} /> },
  { to: "/admin/disputes", label: "Disputes", icon: <AlertTriangle className={ic} /> },
  { to: "/admin/settings", label: "Pricing", icon: <DollarSign className={ic} /> },
];
