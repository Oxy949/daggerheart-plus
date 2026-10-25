import { MODULE_ID, SYSTEM_ID } from "./module/constants.js";
import { registerModuleSettings } from "./module/settings.js";
import {
  applyEnhancedChatStyles,
  applyParticleEffects,
  applyCriticalHitParticles,
  applyColorOverrides,
} from "./module/style-toggles.js";
import { registerDomainCardHooks } from "./module/domain-cards.js";
import { enhanceTooltipManager, applyTooltipCardMaxWidth } from "./module/tooltip-manager.js";
import {
  registerDaggerheartPlusSheets,
  getDefaultSheetSize,
  getDefaultAdversarySheetSize,
  applyDefaultSizeToApp,
} from "./module/sheets/register.js";
import { preloadModuleTemplates } from "./module/template-preload.js";
import { registerGradientSettings } from "./module/progress-gradients.js";
import { getRenderedApplications } from "./module/compat.js";
import {
  bootstrapGlobalUi,
  manageFearTracker,
  manageTokenCounters,
  EnhancedChatEffects,
} from "./module/global-api.js";
import { registerUiHooks } from "./module/ui-hooks.js";

registerGradientSettings();
registerUiHooks();

Hooks.once("init", () => {
  console.log("Daggerheart Plus | Initializing module");

  if (game.system.id !== SYSTEM_ID) {
    console.error(
      "Daggerheart Plus | This module requires the Daggerheart system"
    );
    return;
  }

  registerModuleSettings();
  registerDomainCardHooks();
  preloadModuleTemplates();
  enhanceTooltipManager();
});

Hooks.once("ready", async () => {
  try {
    applyColorOverrides();
  } catch (e) {
    console.warn("Daggerheart Plus | Failed to apply initial theme colors", e);
  }

  try {
    const enhancedEnabled = game.settings.get(
      MODULE_ID,
      "enableEnhancedChat"
    );
    applyEnhancedChatStyles(Boolean(enhancedEnabled));

    try {
      EnhancedChatEffects.init();
    } catch (_) {}

    try {
      applyParticleEffects(true);
    } catch (_) {}

    try {
      applyCriticalHitParticles(true);
    } catch (_) {}
  } catch (e) {
    console.warn(
      "Daggerheart Plus | Failed to apply initial enhanced chat state",
      e
    );
  }

  console.log("Daggerheart Plus | Module ready - creating enhanced sheets");

  registerDaggerheartPlusSheets();
  await bootstrapGlobalUi();

  Hooks.on("updateSetting", async (setting) => {
    const compositeKey = setting?.key ?? "";
    const dotIdx = compositeKey.indexOf(".");
    const ns = dotIdx > -1 ? compositeKey.slice(0, dotIdx) : "";
    const settingName = dotIdx > -1 ? compositeKey.slice(dotIdx + 1) : compositeKey;

    if (ns !== MODULE_ID) return;

    if (settingName === "enableFearTracker") {
      await manageFearTracker();
      return;
    }

    if (settingName === "enableTokenCounters") {
      await manageTokenCounters();
      return;
    }

    if (settingName === "alwaysShowLinkedActorCounters") {
      window.daggerheartPlus?.tokenCounter?.refreshSource?.();
      window.daggerheartPlus?.updateCountersWrapperDisplay?.();
      return;
    }

    if (settingName === "enableEnhancedChat") {
      try {
        applyEnhancedChatStyles(Boolean(setting.value));
      } catch (e) {
        console.warn(
          "Daggerheart Plus | Failed applying enhanced chat toggle (updateSetting)",
          e
        );
      }

      try {
        applyCriticalHitParticles();
      } catch (e) {
        console.warn(
          "Daggerheart Plus | Failed applying critical hit particles toggle (updateSetting)",
          e
        );
      }
      return;
    }

    if (settingName === "enableParticles") {
      try {
        applyParticleEffects(Boolean(setting.value));
      } catch (e) {
        console.warn(
          "Daggerheart Plus | Failed applying particle effects toggle (updateSetting)",
          e
        );
      }
      return;
    }

    if (
      settingName === "defaultSheetWidth" ||
      settingName === "defaultSheetHeight"
    ) {
      const size = getDefaultSheetSize();
      for (const app of getRenderedApplications()) {
        const name = app?.constructor?.name;
        if (!name?.startsWith?.("DaggerheartPlus")) continue;
        if (name?.includes?.("Adversary")) continue;

        if (name === "DaggerheartPlusCompanionSheet") {
          applyDefaultSizeToApp(app, { width: 340, height: size.height });
        } else {
          applyDefaultSizeToApp(app, size);
        }
      }
      if (game.user?.isGM)
        ui.notifications.info(
          `DH+ sheet size set to ${size.width}x${size.height}.`
        );
      return;
    }

    if (
      settingName === "adversarySheetWidth" ||
      settingName === "adversarySheetHeight"
    ) {
      const size = getDefaultAdversarySheetSize();
      for (const app of getRenderedApplications()) {
        if (app?.constructor?.name === "DaggerheartPlusAdversarySheet") {
          applyDefaultSizeToApp(app, size);
        }
      }
      if (game.user?.isGM)
        ui.notifications.info(
          `DH+ adversary sheet size set to ${size.width}x${size.height}.`
        );
      return;
    }

    if (settingName === "tooltipCardMaxWidth") {
      try {
        applyTooltipCardMaxWidth(setting.value);
      } catch (e) {
        console.warn(
          "Daggerheart Plus | Failed applying tooltip card max width (updateSetting)",
          e
        );
      }
      return;
    }
    if (settingName === "enableCharacterSheetSidebars") {
      const useRails = game.settings.get(
        MODULE_ID,
        "enableCharacterSheetSidebars"
      );
      for (const app of getRenderedApplications()) {
        if (app?.constructor?.name !== "DaggerheartPlusCharacterSheet")
          continue;
        if (useRails) app._mountInlineRails?.();
        else app._removeInlineRails?.();
      }
      return;
    }
  });

  if (game.user.isGM) {
    ui.notifications.info("Daggerheart Plus module loaded successfully!");
  }
});
