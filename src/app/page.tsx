import { redirect } from "next/navigation";
import { hasProfile, getProfileCompleteness } from "@/lib/profile-check";
import { DashboardContent } from "@/components/dashboard-content";

export default function DashboardPage() {
  if (!hasProfile()) {
    redirect("/setup");
  }

  const completeness = getProfileCompleteness();

  return <DashboardContent completeness={completeness} />;
}
