import { redirect } from "next/navigation";

/**
 * Root page redirects to /meetings (the main app view).
 * A real production app would show a landing page or login here.
 */
export default function RootPage() {
  redirect("/meetings");
}
