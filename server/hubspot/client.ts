import "server-only";
import { Client } from "@hubspot/api-client";

/**
 * Singleton HubSpot API client, initialised with the Private App Access Token.
 *
 * This module is server-only. The `server-only` import causes a build-time
 * error if this file is accidentally imported by a client component.
 */

function createHubSpotClient(): Client {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    throw new Error(
      "HUBSPOT_PRIVATE_APP_TOKEN is not set. " +
        "Create a Private App in your HubSpot portal and copy its access token.",
    );
  }
  return new Client({ accessToken: token });
}

// Singleton — reuse across requests in the same server process.
let _client: Client | null = null;

export function getHubSpotClient(): Client {
  if (!_client) {
    _client = createHubSpotClient();
  }
  return _client;
}
