import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Read required env vars
const APP_ID = process.env.GITHUB_APP_ID;
const PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH;

if (!APP_ID || !PRIVATE_KEY_PATH) {
  console.error(
    "Please set GITHUB_APP_ID and GITHUB_PRIVATE_KEY_PATH env vars."
  );
  process.exit(1);
}

const privateKey = fs.readFileSync(path.resolve(PRIVATE_KEY_PATH), "utf8");

// Helper to create a JWT for GitHub App authentication
function createAppJwt(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // issued at time, 1 min in the past to allow for clock drift
    exp: now + 600, // JWT expiration time (10 min max)
    iss: appId,
  };

  // Header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  function base64url(obj) {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);
  const token = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(token);
  const signature = sign
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${token}.${signature}`;
}

async function main() {
  const jwt = createAppJwt(APP_ID, privateKey);
  const octokit = new Octokit({
    auth: jwt,
    authStrategy: undefined, // Use token directly
  });

  // Use the REST endpoint for listing installations
  const res = await octokit.request("GET /app/installations", {
    headers: {
      authorization: `Bearer ${jwt}`,
      accept: "application/vnd.github+json",
    },
  });

  console.log("Installations:");
  for (const inst of res.data) {
    console.log(
      `- ID: ${inst.id}, Account: ${inst.account?.login}, Target: ${inst.target_type}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
