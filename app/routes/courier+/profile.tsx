import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { courierNav } from "~/components/delivery/nav-configs";
import { CourierProfileForm } from "~/components/delivery/courier-profile-form";

export default function CourierProfile() {
  return (
    <RoleGate allow={["courier"]}>
      <AppShell nav={courierNav} title="Profile & verification">
        <CourierProfileForm />
      </AppShell>
    </RoleGate>
  );
}
