import { MODULE_ID, COLOR_LIGHT_DARK_DEFAULTS, COLOR_CSS_MAP, colorSettingKey } from "./constants.js";
import { getRenderedApplications } from "./compat.js";

const DEFAULT_FONT_URL = "https://fonts.googleapis.com/css2?family=Texturina:ital,opsz,wght@0,12..72,100..900;1,12..72,100..900&display=swap";

function getColor(key, variant) {
  const defaults = COLOR_LIGHT_DARK_DEFAULTS[key];
  try {
    const raw = game.settings.get(MODULE_ID, colorSettingKey(key, variant));
    return (raw ? String(raw) : null) || defaults[variant];
  } catch {
    return defaults[variant];
  }
}

export function applyColorOverrides() {
  try {
    const merged = {};
    for (const key of Object.keys(COLOR_LIGHT_DARK_DEFAULTS)) {
      merged[key] = {
        light: getColor(key, "light"),
        dark: getColor(key, "dark"),
      };
    }

    let css = "body, .daggerheart-plus.sheet {\n";
    for (const [key, cssVar] of Object.entries(COLOR_CSS_MAP)) {
      const { light, dark } = merged[key];
      css += `  ${cssVar}: light-dark(${light}, ${dark});\n`;
    }

    const shadowLight = "rgba(0, 0, 0, 0.15)";
    const shadowDark = "rgba(0, 0, 0, 0.5)";
    css += `  --dhp-shadow: light-dark(${shadowLight}, ${shadowDark});\n`;

    const shadowHeavyLight = "rgba(0, 0, 0, 0.25)";
    const shadowHeavyDark = "rgba(0, 0, 0, 0.7)";
    css += `  --dhp-shadow-heavy: light-dark(${shadowHeavyLight}, ${shadowHeavyDark});\n`;

    css += "}\n";

    let styleEl = document.getElementById("dhp-color-overrides");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dhp-color-overrides";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  } catch (e) {
    console.warn("Daggerheart Plus | Failed to apply color overrides", e);
  }
}

export function applyEnhancedChatStyles(enabled) {
  try {
    const LINK_ID = "dhp-enhanced-chat-style";
    const TEMPLATES_LINK_ID = "dhp-enhanced-chat-templates-style";

    let link = document.getElementById(LINK_ID);
    let templatesLink = document.getElementById(TEMPLATES_LINK_ID);

    if (enabled) {
      if (!link) {
        link = document.createElement("link");
        link.id = LINK_ID;
        link.rel = "stylesheet";
        link.href = `modules/${MODULE_ID}/styles/enhanced-chat-message.css`;
        document.head.appendChild(link);
      }

      if (!templatesLink) {
        templatesLink = document.createElement("link");
        templatesLink.id = TEMPLATES_LINK_ID;
        templatesLink.rel = "stylesheet";
        templatesLink.href = `modules/${MODULE_ID}/styles/enhanced-chat-templates.css`;
        document.head.appendChild(templatesLink);
      }
    } else {
      if (link) link.remove();
      if (templatesLink) templatesLink.remove();
    }
  } catch (e) {
    console.warn(
      "Daggerheart Plus | Failed to toggle enhanced chat stylesheet link",
      e
    );
  }
}

export function applyParticleEffects(enabled) {
  try {
    const particlesEnabled = game.settings.get(MODULE_ID, "enableParticles");
    if (!particlesEnabled) {
      document.querySelectorAll(".dhp-spell-particles").forEach((canvas) => {
        const host = canvas.parentElement;
        if (host && host._dhpParticlesFX) {
          host._dhpParticlesFX.stop();
        }
      });
    }

    for (const app of getRenderedApplications()) {
      if (app?.constructor?.name === "DaggerheartPlusCharacterSheet") {
        if (particlesEnabled) {
          app._mountSpellParticles?.();
        } else {
          app._unmountSpellParticles?.();
        }
      }
    }
  } catch (e) {
    console.warn(
      "Daggerheart Plus | Failed to apply particle effects toggle",
      e
    );
  }
}

export function applyCriticalHitParticles(enabled) {
  try {
    const critParticlesEnabled = Boolean(
      game.settings.get(MODULE_ID, "enableParticles")
    );
    const enhancedChatEnabled = Boolean(
      game.settings.get(MODULE_ID, "enableEnhancedChat")
    );
    const shouldEnable = critParticlesEnabled && enhancedChatEnabled;

    if (!shouldEnable) {
      document
        .querySelectorAll(".dhp-crit-particles")
        .forEach((canvas) => {
          const host = canvas.parentElement;
          if (host && host._dhpCritFX) {
            host._dhpCritFX.stop();
          } else {
            host?.classList?.remove?.("dhp-crit-fx");
            canvas.remove();
          }
        });
    }

    if (window.daggerheartPlus?.enhancedChatEffects) {
      if (shouldEnable) {
        window.daggerheartPlus.enhancedChatEffects.init();
      } else {
        window.daggerheartPlus.enhancedChatEffects.disable();
      }
    }
  } catch (e) {
    console.warn(
      "Daggerheart Plus | Failed to apply critical hit particles toggle",
      e
    );
  }
}

export function applyDomainCardOpenSetting(enabled) {
  try {
    const moveElements = document.querySelectorAll(
      ".domain-card-move, .action-move"
    );
    moveElements.forEach((element) => {
      if (enabled) {
        element.setAttribute("open", "");
        const chevron = element.querySelector(".fa-chevron-down");
        if (chevron) {
          chevron.style.display = "none";
        }
      } else {
        element.removeAttribute("open");
        const chevron = element.querySelector(".fa-chevron-down");
        if (chevron) {
          chevron.style.display = "";
        }
      }
    });
  } catch (e) {
    console.warn(
      "Daggerheart Plus | Failed to apply move open setting",
      e
    );
  }
}

export function applyTokenCountersVisibilityBySetting() {
  try {
    const enabled = Boolean(game.settings.get(MODULE_ID, "enableTokenCounters"));
    const left = document.querySelector("#token-counters-left");
    const right = document.querySelector("#token-counters-right");
    if (left) left.style.display = enabled ? "" : "none";
    if (right) right.style.display = enabled ? "" : "none";

    try {
      window.daggerheartPlus.updateCountersWrapperDisplay();
    } catch (_) { }
  } catch (_) { }
}

export function applyCustomFont() {
  try {
    const STYLE_ID = "dhp-custom-font-style";
    const FONT_LINK_ID = "dhp-custom-font-link";

    let fontLink = document.getElementById(FONT_LINK_ID);
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = FONT_LINK_ID;
      fontLink.rel = "stylesheet";
      fontLink.href = DEFAULT_FONT_URL;
      document.head.appendChild(fontLink);
    }

    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    const customFontFile = game.settings.get(MODULE_ID, "customFontFile");

    if (customFontFile) {
      styleEl.textContent = `
        @font-face {
          font-family: "DHP-CustomFont";
          src: url("${customFontFile}");
          font-display: swap;
        }
        :root {
          --dhp-title-font: "DHP-CustomFont";
        }
      `;
    } else {
      styleEl.textContent = `
        :root {
          --dhp-title-font: "Texturina";
        }
      `;
    }
  } catch (e) {
    console.warn("Daggerheart Plus | Failed to apply custom font", e);
  }
}
