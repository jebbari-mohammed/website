const { onRequest } = require("firebase-functions/v2/https");
const crypto = require("node:crypto");

const PROJECT_ID = "ai-gym-coach-13ee1";
const REGION = "us-central1";
const FUNCTION_NAME = "edgeProOauthProxy";
const BASE_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}`;
const RESOURCE = `${BASE_URL}/mcp`;
const EDGE_UPSTREAM = "https://getedge.cc/mcp";
const CLIENT_ID = "chatgpt-edge-pro-private";
const SCOPE = "edge.read";
const CODE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

function setNoStore(res) {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "no-referrer");
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function fromB64url(input) {
  return Buffer.from(input, "base64url");
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getParam(req, name) {
  const value = req.method === "GET" ? req.query?.[name] : req.body?.[name];
  if (Array.isArray(value)) return String(value[0] ?? "");
  return typeof value === "string" ? value : "";
}

function isAllowedRedirectUri(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "chatgpt.com") return false;
    if (url.pathname === "/connector_platform_oauth_redirect") return true;
    return /^\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(url.pathname);
  } catch {
    return false;
  }
}

function normalizeScope(value) {
  const scopes = String(value || SCOPE)
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
  if (!scopes.length || scopes.some((scope) => scope !== SCOPE)) return null;
  return SCOPE;
}

function isPlausibleEdgeKey(value) {
  return /^edge_[A-Za-z0-9_-]{16,}$/.test(String(value || ""));
}

function pkceChallenge(verifier) {
  return b64url(crypto.createHash("sha256").update(verifier, "utf8").digest());
}

function authorizationCipherKey(codeChallenge) {
  return crypto.createHash("sha256").update(codeChallenge, "utf8").digest();
}

function sealAuthorizationCode(payload, codeChallenge) {
  const iv = crypto.randomBytes(12);
  const key = authorizationCipherKey(codeChallenge);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return ["v1", b64url(iv), b64url(tag), b64url(ciphertext)].join(".");
}

function openAuthorizationCode(code, codeVerifier) {
  const parts = String(code || "").split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("invalid_code");

  const challenge = pkceChallenge(codeVerifier);
  const key = authorizationCipherKey(challenge);
  const iv = fromB64url(parts[1]);
  const tag = fromB64url(parts[2]);
  const ciphertext = fromB64url(parts[3]);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  const payload = JSON.parse(plaintext);
  if (!payload || typeof payload !== "object") throw new Error("invalid_code");
  return payload;
}

function encodeToken(prefix, payload) {
  return `${prefix}.${b64url(Buffer.from(JSON.stringify(payload), "utf8"))}`;
}

function decodeToken(token, expectedPrefix) {
  const [prefix, body, extra] = String(token || "").split(".");
  if (prefix !== expectedPrefix || !body || extra) throw new Error("invalid_token");
  const payload = JSON.parse(fromB64url(body).toString("utf8"));
  if (!payload || payload.r !== RESOURCE || payload.s !== SCOPE || !isPlausibleEdgeKey(payload.k)) {
    throw new Error("invalid_token");
  }
  return payload;
}

function oauthError(res, status, error, description) {
  setNoStore(res);
  return res.status(status).json({ error, error_description: description });
}

function redirectOauthError(res, redirectUri, state, error, description) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  url.searchParams.set("iss", BASE_URL);
  setNoStore(res);
  return res.redirect(302, url.toString());
}

function requireOAuthRequest(req, res) {
  const responseType = getParam(req, "response_type");
  const clientId = getParam(req, "client_id");
  const redirectUri = getParam(req, "redirect_uri");
  const state = getParam(req, "state");
  const resource = getParam(req, "resource");
  const scope = normalizeScope(getParam(req, "scope"));
  const codeChallenge = getParam(req, "code_challenge");
  const codeChallengeMethod = getParam(req, "code_challenge_method");

  if (!isAllowedRedirectUri(redirectUri)) {
    oauthError(res, 400, "invalid_request", "Unsupported redirect_uri");
    return null;
  }
  if (clientId !== CLIENT_ID) {
    redirectOauthError(res, redirectUri, state, "unauthorized_client", "Unknown OAuth client");
    return null;
  }
  if (responseType !== "code") {
    redirectOauthError(res, redirectUri, state, "unsupported_response_type", "Only authorization code is supported");
    return null;
  }
  if (resource !== RESOURCE) {
    redirectOauthError(res, redirectUri, state, "invalid_target", "Unexpected OAuth resource");
    return null;
  }
  if (!scope) {
    redirectOauthError(res, redirectUri, state, "invalid_scope", "Only edge.read is supported");
    return null;
  }
  if (codeChallengeMethod !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
    redirectOauthError(res, redirectUri, state, "invalid_request", "PKCE S256 is required");
    return null;
  }

  return { clientId, redirectUri, state, resource, scope, codeChallenge };
}

function renderAuthorizationForm(res, params) {
  setNoStore(res);
  res.set("Content-Type", "text/html; charset=utf-8");
  res.set(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  );

  const hidden = Object.entries({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    resource: params.resource,
    scope: params.scope,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  })
    .map(([name, value]) => `<input type="hidden" name="${htmlEscape(name)}" value="${htmlEscape(value)}">`)
    .join("");

  return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connect Edge Pro</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#0b0d10;color:#f5f7fa;margin:0;min-height:100vh;display:grid;place-items:center}
main{width:min(520px,calc(100% - 32px));background:#151922;border:1px solid #2a3140;border-radius:18px;padding:28px;box-sizing:border-box}
h1{margin:0 0 10px;font-size:26px}p{color:#b7c0cf;line-height:1.5}label{display:block;margin:22px 0 8px;font-weight:650}
input[type=password]{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #3b4558;background:#0f131a;color:#fff;padding:13px 14px;font:inherit}
button{margin-top:18px;width:100%;border:0;border-radius:10px;background:#fff;color:#111;padding:13px 16px;font:700 15px system-ui;cursor:pointer}
small{display:block;color:#8490a3;margin-top:14px;line-height:1.45}
</style>
</head>
<body>
<main>
<h1>Connect Edge Pro to ChatGPT</h1>
<p>Paste your Edge Pro key. It is used only to create this OAuth connection and is not stored by this proxy.</p>
<form method="post" action="${htmlEscape(BASE_URL)}/authorize" autocomplete="off">
${hidden}
<label for="edge_key">Edge Pro key</label>
<input id="edge_key" name="edge_key" type="password" required inputmode="text" autocomplete="off" placeholder="edge_…">
<button type="submit">Connect Edge Pro</button>
<small>The authorization code is protected with ChatGPT's PKCE challenge. GitHub and Firebase source code contain no Edge key.</small>
</form>
</main>
</body>
</html>`);
}

function protectedResourceMetadata(res) {
  setNoStore(res);
  return res.json({
    resource: RESOURCE,
    authorization_servers: [BASE_URL],
    scopes_supported: [SCOPE],
    resource_documentation: "https://getedge.cc/docs/",
  });
}

function authorizationServerMetadata(res) {
  setNoStore(res);
  return res.json({
    issuer: BASE_URL,
    authorization_response_iss_parameter_supported: true,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    registration_endpoint: `${BASE_URL}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE],
  });
}

function registerClient(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.map(String) : [];
  if (!redirectUris.length || redirectUris.some((uri) => !isAllowedRedirectUri(uri))) {
    return oauthError(res, 400, "invalid_redirect_uri", "Only ChatGPT OAuth redirect URIs are allowed");
  }

  setNoStore(res);
  return res.status(201).json({
    client_id: CLIENT_ID,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: SCOPE,
  });
}

function authorize(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const params = requireOAuthRequest(req, res);
  if (!params) return;

  if (req.method === "GET") {
    return renderAuthorizationForm(res, params);
  }

  const edgeKey = getParam(req, "edge_key");
  if (!isPlausibleEdgeKey(edgeKey)) {
    return redirectOauthError(res, params.redirectUri, params.state, "access_denied", "The Edge key format is invalid");
  }

  const code = sealAuthorizationCode(
    {
      k: edgeKey,
      c: params.clientId,
      u: params.redirectUri,
      r: params.resource,
      s: params.scope,
      exp: Date.now() + CODE_TTL_MS,
    },
    params.codeChallenge
  );

  const redirect = new URL(params.redirectUri);
  redirect.searchParams.set("code", code);
  if (params.state) redirect.searchParams.set("state", params.state);
  redirect.searchParams.set("iss", BASE_URL);
  setNoStore(res);
  return res.redirect(302, redirect.toString());
}

function token(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const grantType = getParam(req, "grant_type");
  const clientId = getParam(req, "client_id");
  const resource = getParam(req, "resource") || RESOURCE;

  if (clientId !== CLIENT_ID) {
    return oauthError(res, 401, "invalid_client", "Unknown OAuth client");
  }
  if (resource !== RESOURCE) {
    return oauthError(res, 400, "invalid_target", "Unexpected OAuth resource");
  }

  if (grantType === "authorization_code") {
    const code = getParam(req, "code");
    const verifier = getParam(req, "code_verifier");
    const redirectUri = getParam(req, "redirect_uri");

    if (!code || !verifier || !redirectUri || !isAllowedRedirectUri(redirectUri)) {
      return oauthError(res, 400, "invalid_request", "Missing authorization-code parameters");
    }

    let payload;
    try {
      payload = openAuthorizationCode(code, verifier);
    } catch {
      return oauthError(res, 400, "invalid_grant", "Authorization code or PKCE verifier is invalid");
    }

    if (
      payload.exp < Date.now() ||
      payload.c !== CLIENT_ID ||
      payload.u !== redirectUri ||
      payload.r !== RESOURCE ||
      payload.s !== SCOPE ||
      !isPlausibleEdgeKey(payload.k)
    ) {
      return oauthError(res, 400, "invalid_grant", "Authorization code is expired or does not match this connection");
    }

    const tokenPayload = { r: RESOURCE, s: SCOPE, k: payload.k };
    setNoStore(res);
    return res.json({
      access_token: encodeToken("ept1", tokenPayload),
      token_type: "Bearer",
      expires_in: TOKEN_TTL_SECONDS,
      refresh_token: encodeToken("ert1", tokenPayload),
      scope: SCOPE,
    });
  }

  if (grantType === "refresh_token") {
    let payload;
    try {
      payload = decodeToken(getParam(req, "refresh_token"), "ert1");
    } catch {
      return oauthError(res, 400, "invalid_grant", "Refresh token is invalid");
    }

    setNoStore(res);
    return res.json({
      access_token: encodeToken("ept1", payload),
      token_type: "Bearer",
      expires_in: TOKEN_TTL_SECONDS,
      refresh_token: encodeToken("ert1", payload),
      scope: SCOPE,
    });
  }

  return oauthError(res, 400, "unsupported_grant_type", "Only authorization_code and refresh_token are supported");
}

function challenge(res, description = "Connect your Edge Pro key to continue") {
  setNoStore(res);
  res.set(
    "WWW-Authenticate",
    `Bearer resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource", scope="${SCOPE}", error="invalid_token", error_description="${description.replaceAll('"', "'")}"`
  );
  return res.status(401).send("Authentication required");
}

function bearerFromRequest(req) {
  const header = String(req.get("authorization") || "");
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  try {
    return decodeToken(match[1], "ept1");
  } catch {
    return null;
  }
}

async function proxyMcp(req, res) {
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    return res.status(405).send("Method Not Allowed");
  }

  const tokenPayload = bearerFromRequest(req);
  if (!tokenPayload) return challenge(res);

  const headers = new Headers();
  for (const name of [
    "accept",
    "accept-language",
    "content-type",
    "mcp-protocol-version",
    "mcp-session-id",
    "last-event-id",
    "user-agent",
  ]) {
    const value = req.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("authorization", `Bearer ${tokenPayload.k}`);

  const init = {
    method: req.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    if (Buffer.isBuffer(req.rawBody)) {
      init.body = req.rawBody;
    } else if (req.body !== undefined) {
      init.body = Buffer.from(JSON.stringify(req.body));
    }
  }

  let upstream;
  try {
    upstream = await fetch(EDGE_UPSTREAM, init);
  } catch {
    return res.status(502).send("Edge upstream unavailable");
  }

  res.status(upstream.status);
  for (const name of [
    "content-type",
    "cache-control",
    "mcp-session-id",
    "www-authenticate",
    "location",
  ]) {
    const value = upstream.headers.get(name);
    if (value) res.set(name, value);
  }
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "no-referrer");

  if (!upstream.body) return res.end();

  try {
    const reader = upstream.body.getReader();
    while (!res.writableEnded) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    return res.end();
  } catch {
    if (!res.headersSent) return res.status(502).send("Edge upstream stream failed");
    return res.end();
  }
}

exports.edgeProOauthProxy = onRequest(
  {
    region: REGION,
    memory: "256MiB",
    timeoutSeconds: 540,
    maxInstances: 3,
    concurrency: 40,
    invoker: "public",
    serviceAccount: "izem-functions-runtime@ai-gym-coach-13ee1.iam.gserviceaccount.com",
    cors: false,
  },
  async (req, res) => {
    const path = req.path || "/";

    if (path === "/.well-known/oauth-protected-resource" && req.method === "GET") {
      return protectedResourceMetadata(res);
    }
    if (path === "/.well-known/oauth-authorization-server" && req.method === "GET") {
      return authorizationServerMetadata(res);
    }
    if (path === "/register") return registerClient(req, res);
    if (path === "/authorize") return authorize(req, res);
    if (path === "/token") return token(req, res);
    if (path === "/mcp") return proxyMcp(req, res);

    setNoStore(res);
    return res.status(200).json({
      service: "Edge Pro OAuth MCP proxy",
      mcp: RESOURCE,
      auth: `${BASE_URL}/.well-known/oauth-protected-resource`,
    });
  }
);
