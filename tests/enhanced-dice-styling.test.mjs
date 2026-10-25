import assert from "node:assert/strict";
import test from "node:test";
import { EnhancedDiceStyling } from "../scripts/applications/enhanced-dice-styling.js";

function chatElement() {
  const classes = new Set(["chat-message"]);
  return {
    classList: {
      contains: (name) => classes.has(name),
      add: (...names) => names.forEach((name) => classes.add(name)),
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

test("the three-argument Foundry hook styles the message, not the render context", () => {
  const element = chatElement();
  const message = { flags: { daggerheart: { isHope: true, isDuality: true } } };
  const context = { flags: { daggerheart: { isFear: true } } };

  EnhancedDiceStyling._onRenderChatMessageHTML(message, element, context);

  assert.ok(element.classList.contains("hope"));
  assert.ok(element.classList.contains("duality"));
  assert.equal(element.classList.contains("fear"), false);
});

test("the two-argument Foundry hook still styles critical messages", () => {
  const element = chatElement();
  EnhancedDiceStyling._onRenderChatMessageHTML(
    { flags: { daggerheart: { isCrit: true } } },
    element,
  );
  assert.ok(element.classList.contains("critical"));
});

test("render context does not turn an unrelated message into a system roll", () => {
  const element = chatElement();
  EnhancedDiceStyling._onRenderChatMessageHTML(
    { flags: {} },
    element,
    { flags: { daggerheart: { isHope: true } } },
  );
  assert.equal(element.classList.contains("hope"), false);
});
