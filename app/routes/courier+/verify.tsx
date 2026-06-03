import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { courierNav } from "~/components/delivery/nav-configs";
import { CourierProfileForm } from "~/components/delivery/courier-profile-form";

export default function CourierVerify() {
  return (
    <RoleGate allow={["courier"]}>
      <AppShell nav={courierNav} title="Get verified">
        <p className="mb-3 text-sm text-muted-foreground">
          Add your courier and vehicle details to start accepting jobs. Our team
          reviews new couriers before they can go online.
        </p>
        <CourierProfileForm redirectOnSave="/courier" />
      </AppShell>
    </RoleGate>
  );
}
