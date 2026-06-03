import { apiRequest, apiGet, type ApiResponse } from "~/lib/api.client";
import type { DeliveryStatus, PackageSize } from "./delivery.shared";

function post<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method: "POST", data });
}
function put<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method: "PUT", data });
}

export const deliveryApi = {
  // account
  me: () => apiGet("/api/account/me"),
  setRole: (role: "customer" | "courier") => post("/api/account/role", { role }),

  // quote / pricing
  quote: (body: { pickup: any; dropoff: any; package_size: PackageSize }) =>
    post("/api/deliveries/quote", body),
  pricing: () => apiGet("/api/pricing"),

  // customer
  createDelivery: (body: any) => post("/api/deliveries", body),
  myDeliveries: () => apiGet("/api/deliveries/mine"),
  rate: (id: string, stars: number, comment: string) =>
    post(`/api/deliveries/${id}/rate`, { stars, comment }),

  // shared single
  getDelivery: (id: string) => apiGet(`/api/deliveries/${id}`),
  cancel: (id: string, reason: string) => post(`/api/deliveries/${id}/cancel`, { reason }),
  messages: (id: string) => apiGet(`/api/deliveries/${id}/messages`),
  sendMessage: (id: string, body: string) => post(`/api/deliveries/${id}/messages`, { body }),
  raiseDispute: (id: string, reason: string) => post(`/api/deliveries/${id}/dispute`, { reason }),

  // courier
  courierProfile: () => apiGet("/api/courier/profile"),
  updateCourierProfile: (body: any) => put("/api/courier/profile", body),
  setOnline: (online: boolean) => post("/api/courier/online", { online }),
  courierRatings: () => apiGet("/api/courier/ratings"),
  availableJobs: () => apiGet("/api/courier/jobs/available"),
  myJobs: () => apiGet("/api/courier/jobs/mine"),
  acceptJob: (id: string) => post(`/api/courier/jobs/${id}/accept`),
  advanceJob: (id: string) => post(`/api/courier/jobs/${id}/advance`),
  setJobStatus: (id: string, status: DeliveryStatus) => post(`/api/courier/jobs/${id}/status`, { status }),
  updateLocation: (id: string, lat: number, lng: number) =>
    post(`/api/courier/jobs/${id}/location`, { lat, lng }),
  saveProof: (id: string, kind: "pickup" | "delivery", payload: any) =>
    post(`/api/courier/jobs/${id}/proof/${kind}`, payload),

  // notifications
  notifications: () => apiGet("/api/notifications"),
  markRead: () => post("/api/notifications/read"),

  // uploads
  upload: async (file: File): Promise<{ url: string } | null> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiRequest("/api/uploader/image", { method: "POST", data: form });
    // uploader returns { success, data: { url, ... } }
    return (res as any)?.data?.url ? { url: (res as any).data.url } : null;
  },

  // admin
  adminUsers: (role?: "customer" | "courier") =>
    apiGet("/api/admin/users", role ? { role } : undefined),
  adminCouriers: () => apiGet("/api/admin/couriers"),
  verifyCourier: (userId: string, status: "verified" | "rejected" | "pending") =>
    post(`/api/admin/couriers/${userId}/verify`, { status }),
  setUserActive: (id: string, active: boolean) => post(`/api/admin/users/${id}/active`, { active }),
  adminDeliveries: () => apiGet("/api/admin/deliveries"),
  adminActiveDeliveries: () => apiGet("/api/admin/deliveries/active"),
  adminDisputes: () => apiGet("/api/admin/disputes"),
  resolveDispute: (id: string, resolution: string) =>
    post(`/api/admin/disputes/${id}/resolve`, { resolution }),
  adminPricing: () => apiGet("/api/admin/pricing"),
  updatePricing: (body: any) => put("/api/admin/pricing", body),
  adminAnalytics: () => apiGet("/api/admin/analytics"),
};
