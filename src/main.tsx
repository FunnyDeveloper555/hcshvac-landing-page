import { createRoot } from "react-dom/client";
import { blueFlameInPlacePage, rewriteBlueFlameAssets } from "./lib/blueFlameWebsite";

const blueFlamePage = blueFlameInPlacePage(window.location.hostname, window.location.pathname);

if (blueFlamePage) {
  // Show the uploaded Blue Flame page at the clean address (e.g. "/" or "/about.html").
  fetch(blueFlamePage)
    .then((r) => r.text())
    .then((html) => {
      document.open();
      document.write(rewriteBlueFlameAssets(html));
      document.close();
    });
} else {
  Promise.all([import("./App.tsx"), import("./index.css")]).then(([{ default: App }]) => {
    createRoot(document.getElementById("root")!).render(<App />);
  });
}
