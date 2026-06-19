---
name: debug-live-autodarts-dom
description: Use for live browser, DOM inspection, Playwright MCP, Chrome DevTools MCP, Autodarts page inspection, reproduction, console/network checks, and UI verification tasks. Do not use for ordinary static code review.
---

# Goal

Use live browser evidence safely when DOM behavior, hydration, overlays, or page state cannot be proven from static code alone.

# Browser rules

- use only the currently active browser tab unless the user explicitly asks otherwise
- do not switch tabs automatically
- do not open new tabs unless explicitly required
- do not navigate away from the active task context unless required
- keep browser-side changes minimal and limited to debugging, reproduction, verification, or UI tests
- use extra caution before destructive actions
- if browser access is unavailable, continue static analysis where possible and state exactly what could not be verified

# Local Chrome connection

- expect Chrome CDP at `http://127.0.0.1:9222`
- the persistent MCP profile is `%LOCALAPPDATA%\Chrome-MCP-Profile`
- verify the endpoint through `http://127.0.0.1:9222/json/version`
- prefer Chrome DevTools MCP for the existing active tab; use Playwright MCP when the task specifically requires it
- if the endpoint responds but no browser page is visible to the MCP tool, report the MCP connection mismatch instead of opening another browser

# Context budget

- inspect browser state and the smallest relevant owner files
- search first, then open nearest tests or helpers only when static context is needed
- avoid `dist/**`
- avoid `docs/**` unless task-relevant
- stop expanding once live evidence explains the issue

# Autodarts Scenarios

Consult `references/live-dom-scenarios.md` when choosing a live reproduction target.

Relevant scenarios include:
- original match page without Tampermonkey for baseline DOM inspection
- X01 page with no checkout
- X01 page with visible checkout
- virtual board
- live board
- Checkout Board Targets
- TV Board Zoom
- reload/F5 overlay hydration behavior

# Output requirements

A valid result must separate observed browser facts from static-code inference and state any browser scenario that could not be verified.
