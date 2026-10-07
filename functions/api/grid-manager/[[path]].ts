import {createRemoteJWKSet, jwtVerify} from "jose";
import {createGridManagerHandler} from "../../../server/gridManager.ts";

type Env = Record<string, string>;
const handlers = new WeakMap<Env, ReturnType<typeof createGridManagerHandler>>();
const keys = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function onRequest(context: {request: Request; env: Env}) {
  const {request, env} = context;
  const error = (status: number, message: string) => Response.json({error: message}, {status, headers: {"Cache-Control": "no-store"}});
  const team = env.GRID_MANAGER_ACCESS_TEAM_DOMAIN, audience = env.GRID_MANAGER_ACCESS_AUD;
  if (!team || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team) || !audience) return error(503, "Grid Manager requires configured Cloudflare Access protection.");
  if (request.headers.get("Sec-Fetch-Site") === "cross-site" || request.headers.has("Origin") && request.headers.get("Origin") !== new URL(request.url).origin) return error(403, "Same-origin connection required.");
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!assertion) return error(401, "Sign in through Cloudflare Access to connect to Grid Manager.");
  try {
    let jwks = keys.get(team);
    if (!jwks) {jwks = createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`)); keys.set(team, jwks);}
    await jwtVerify(assertion, jwks, {issuer: `https://${team}`, audience, algorithms: ["RS256"]});
  } catch {return error(401, "Grid Manager Access session is invalid or expired.");}
  let handle = handlers.get(env);
  if (!handle) {handle = createGridManagerHandler(env); handlers.set(env, handle);}
  return handle(request);
}
