import { loadGallery } from "@/lib/gallery";
import LaunchPage from "../components/LaunchPage";

export default function Launch() {
  return <LaunchPage known={loadGallery().map(({ url, title, author }) => ({ url, title, author }))} />;
}
