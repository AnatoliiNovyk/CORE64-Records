import { permanentRedirect } from "next/navigation";

/** Hostname product is at `/`; keep old path as 308. */
export default function StudioRedirectPage() {
  permanentRedirect("/");
}
