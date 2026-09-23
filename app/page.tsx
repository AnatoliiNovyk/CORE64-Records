import {
  isStudioAuthConfigured,
  isStudioAuthenticatedFromCookies,
} from "@/lib/studio/auth";
import StudioHome from "./studio-home";
import StudioLogin from "./studio-login";
import StudioConfigNeeded from "./studio-config-needed";

export const dynamic = "force-dynamic";

export default function Page() {
  if (!isStudioAuthConfigured()) {
    return <StudioConfigNeeded />;
  }
  if (!isStudioAuthenticatedFromCookies()) {
    return <StudioLogin />;
  }
  return <StudioHome />;
}
