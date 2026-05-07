# Troubleshooting

A symptom → fix matrix for v2.0.0. For the full env-var inventory, see [`configuration.md`](./configuration.md).

## Chrome fails to launch (macOS Tahoe / Windows exit 21)

Symptom: `Failed to launch chrome`, `chrome exited immediately`, `code 21`, `executable doesn't exist`.

Cause: System Chrome on macOS 26 (Tahoe) and certain Windows 11 setups crashes on the persistent profile launch.

Fix: Force the bundled Patchright Chromium.

```bash
BROWSER_CHANNEL=chromium npx notebooklm-mcp@latest
# or
NOTEBOOKLM_BROWSER_CHANNEL=chromium npx notebooklm-mcp@latest
```

The fallback is also auto-applied when launch errors match the known patterns, but setting the env var explicitly makes the choice deterministic.

## `ask_question` times out

Symptom: The tool fails after roughly 10 min with a timeout error.

Checks:

1. Confirm the answer wait is sufficient — long-form prompts on notebooks with many sources legitimately exceed 2 min.
   ```bash
   ANSWER_TIMEOUT_MS=900000 npx notebooklm-mcp@latest   # 15 minutes
   ```
   Or per-call: `browser_options.timeout_ms`.
2. Run with a visible browser to see what NotebookLM is doing:
   ```json
   { "name": "ask_question", "arguments": { "question": "...", "show_browser": true } }
   ```
   Or start the server with `HEADLESS=false`.
3. Check `get_health` — if `authenticated=false`, the page is on the login screen, not the notebook.

## Session expired / repeated login prompts

Symptom: NotebookLM keeps redirecting to the login screen, or `get_health` reports `authenticated=false` after a previously successful login.

Workflow:

1. Close every Chrome / Chromium instance the user has open. An open Chrome can hold the persistent profile lock.
2. `re_auth` to wipe stored auth and prompt for a fresh login.
3. If `re_auth` fails repeatedly, run `cleanup_data` with the library preserved:
   ```json
   { "name": "cleanup_data", "arguments": { "confirm": false, "preserve_library": true } }
   ```
   Review the preview, then run again with `confirm: true`. Then `setup_auth`.

## WSL1

Symptom: Chrome refuses to launch under WSL1.

Fix: Upgrade to WSL2.

```powershell
wsl --set-default-version 2
wsl --set-version <distro> 2
```

WSL2 with WSLg (Windows 11 / Windows 10 22H2+) supports a real Chromium and works out of the box.

## Headless Linux server

Symptom: `setup_auth` fails on a server with no display because the login window cannot open.

Fix: Run the one-time setup under `xvfb-run`. After login the persistent Chrome profile lets every subsequent run go fully headless.

```bash
xvfb-run -a npx notebooklm-mcp@latest
# call setup_auth from your client, complete login, then exit
# from then on, run normally:
npx notebooklm-mcp@latest
```

## "Unknown resource: mcp://notebooklm"

Cause: A client used the wrong URI scheme.

Fix: The scheme is `notebooklm://`, not `mcp://`. Supported URIs:

- `notebooklm://library`
- `notebooklm://library/{id}`
- `notebooklm://metadata` (deprecated)

The error message in v2 lists the correct set.

## Orphan Chrome processes

Symptom: Chrome processes survive after the MCP server exits.

v2 ships a 5-second shutdown watchdog and an aggressive teardown path, so this is rare. If it does happen:

1. Kill the lingering Chromes manually.
2. Run `cleanup_data` with `preserve_library: true` to remove stale profile locks.
3. Restart the server.

## Profile lock / `ProcessSingleton` errors

Cause: Another Chrome owns the base profile.

Fix: The default `NOTEBOOK_PROFILE_STRATEGY=auto` falls back to an isolated per-instance profile. To force isolation always:

```bash
NOTEBOOK_PROFILE_STRATEGY=isolated npx notebooklm-mcp@latest
```

## Rate limit reached

Symptom: `NotebookLM rate limit reached (50 queries/day for free accounts)`.

Options:

- Use `re_auth` to switch to a different Google account.
- Use multi-account mode for a clean separation:
  ```bash
  NOTEBOOKLM_ACCOUNT=backup npx notebooklm-mcp@latest
  ```
- Wait until the daily quota resets.
- Upgrade to Google AI Pro/Ultra for higher limits.

## Stealth typing too slow

The default `160–240 WPM` range is realistic but slow for batch use. Either disable stealth typing or tighten the range:

```bash
STEALTH_HUMAN_TYPING=false npx notebooklm-mcp@latest
# or
TYPING_WPM_MIN=400 TYPING_WPM_MAX=600 npx notebooklm-mcp@latest
```

## Citations are empty for `source_format=footnotes`

The DOM citation panel is read after the answer settles. If it is empty:

- The notebook may not have grounded sources for that question.
- The UI may have shifted — check the active selectors in `src/notebooklm/selectors.ts`.
- Run with `show_browser=true` and inspect the live page after the answer renders.

## Follow-up reminder is missing

In v2 the follow-up reminder appended to `ask_question` answers is off by default. Re-enable with:

```bash
NOTEBOOKLM_FOLLOW_UP_REMINDER=true npx notebooklm-mcp@latest
```

## AI marker breaks downstream parsing

The default answer text starts with `[AI-GENERATED via Gemini 2.5 (NotebookLM) — …]`. To return to the unprefixed answer, set:

```bash
NOTEBOOKLM_AI_MARKER=false npx notebooklm-mcp@latest
```

Or replace the prefix with your own:

```bash
NOTEBOOKLM_AI_MARKER_PREFIX="[notebooklm]" npx notebooklm-mcp@latest
```

The `_provenance` envelope on the result remains regardless.

## HTTP transport: `unknown session`

Cause: The client made a `GET /mcp` or `POST /mcp` (non-initialize) without echoing the `Mcp-Session-Id` returned by the initial `initialize` response.

Fix: Capture the `Mcp-Session-Id` response header from the initialize call and pass it on every subsequent request. The lifecycle is owned by the MCP SDK's `StreamableHTTPServerTransport`.
