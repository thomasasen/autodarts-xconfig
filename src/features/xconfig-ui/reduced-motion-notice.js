import { createElement } from "./shell-view.js";

const NOTICE_SELECTOR = "[data-adxconfig-reduced-motion]";
const MOTION_HELP_URL = "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences";

function buildNotice(documentRef, windowRef) {
  const navigatorRef = windowRef?.navigator;
  const isWindows = /windows|win32|win64/i.test(
    `${navigatorRef?.userAgentData?.platform || ""} ${navigatorRef?.platform || ""} ${navigatorRef?.userAgent || ""}`
  );
  const isFirefox = /firefox/i.test(navigatorRef?.userAgent || "");
  const isLinux = /linux|x11/i.test(
    `${navigatorRef?.userAgentData?.platform || ""} ${navigatorRef?.platform || ""} ${navigatorRef?.userAgent || ""}`
  ) && !/android/i.test(navigatorRef?.userAgent || "");
  let platformHelp = "Die Vorgabe stammt meist aus den Bedienungshilfen deines Geräts. Dort „Bewegung reduzieren“ bzw. „Animationen entfernen“ ausschalten.";
  let guideLabel = "Anleitung öffnen";
  if (isWindows) {
    platformHelp = "Windows 11: Einstellungen → Barrierefreiheit → Visuelle Effekte → Animationseffekte einschalten. Windows 10: Erleichterte Bedienung → Anzeige → Animationen anzeigen einschalten.";
    guideLabel = "Windows-Animationseinstellungen öffnen";
  } else if (isLinux) {
    platformHelp = "Linux: In GNOME unter Einstellungen → Barrierefreiheit → Sehen „Animationen reduzieren“ ausschalten. In KDE Plasma die Animationsgeschwindigkeit nicht auf „Sofort“ stellen. Ein einheitlicher Direktlink zu diesen Einstellungen ist unter Linux nicht verfügbar.";
    guideLabel = "Linux-Anleitung öffnen";
  }
  const notice = createElement(documentRef, "aside", {
    className: "ad-xconfig-notice ad-xconfig-notice--info ad-xconfig-motion-notice",
    attributes: {
      "data-adxconfig-reduced-motion": "true",
      "aria-label": "Hinweis zu reduzierter Bewegung",
    },
  });
  const text = createElement(documentRef, "div");
  text.appendChild(createElement(documentRef, "span", {
    text: "„Bewegung reduzieren“ ist aktiv. Dadurch werden einige xConfig-Animationen reduziert oder ausgeschaltet. Deaktiviere die Option, wenn du die vollständigen Animationen und Effekte sehen möchtest.",
  }));
  text.appendChild(createElement(documentRef, "small", {
    className: "ad-xconfig-motion-help",
    text: platformHelp,
  }));
  if (isFirefox) {
    text.appendChild(createElement(documentRef, "small", {
      className: "ad-xconfig-motion-help",
      text: "Firefox: about:config in der Adressleiste öffnen, ui.prefersReducedMotion suchen und als Zahl auf 0 setzen. Diese interne Browser-Seite lässt sich hier nicht direkt öffnen; der Button kopiert ihre Adresse.",
    }));
  }
  notice.appendChild(text);
  const actions = createElement(documentRef, "div", { className: "ad-xconfig-motion-actions" });
  if (isFirefox) {
    const copyButton = createElement(documentRef, "button", {
      className: "ad-xconfig-notice-action",
      type: "button",
      text: "Firefox-Einstellungsadresse kopieren",
    });
    const feedback = createElement(documentRef, "small", {
      className: "ad-xconfig-motion-help",
      attributes: { role: "status" },
    });
    copyButton.addEventListener("click", async () => {
      copyButton.disabled = true;
      try {
        await navigatorRef.clipboard.writeText("about:config");
        feedback.textContent = "Adresse kopiert. In die Adressleiste einfügen und ui.prefersReducedMotion auf 0 setzen.";
      } catch (_) {
        feedback.textContent = "Kopieren nicht möglich. Bitte about:config manuell in der Adressleiste öffnen.";
      } finally {
        copyButton.disabled = false;
      }
    });
    text.appendChild(feedback);
    actions.appendChild(copyButton);
  }
  actions.appendChild(createElement(documentRef, "a", {
    className: "ad-xconfig-notice-action",
    text: guideLabel,
    attributes: isWindows
      ? { href: "ms-settings:easeofaccess-visualeffects" }
      : { href: MOTION_HELP_URL, target: "_blank", rel: "noopener noreferrer" },
  }));
  notice.appendChild(actions);
  return notice;
}

export function createReducedMotionNoticeController({ windowRef, documentRef, getShell }) {
  let mediaQuery = null;

  function sync() {
    const shell = getShell();
    if (!shell) {
      return;
    }
    const notice = shell.querySelector(NOTICE_SELECTOR);
    if (!mediaQuery?.matches) {
      notice?.remove();
    } else if (!notice) {
      shell.insertBefore(buildNotice(documentRef, windowRef), shell.firstChild);
    }
  }

  function start() {
    if (mediaQuery || typeof windowRef?.matchMedia !== "function") {
      return;
    }
    mediaQuery = windowRef.matchMedia("(prefers-reduced-motion: reduce)");
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", sync);
    } else {
      mediaQuery.addListener?.(sync);
    }
    sync();
  }

  function stop() {
    if (typeof mediaQuery?.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", sync);
    } else {
      mediaQuery?.removeListener?.(sync);
    }
    mediaQuery = null;
    getShell()?.querySelector(NOTICE_SELECTOR)?.remove();
  }

  return { start, sync, stop };
}
