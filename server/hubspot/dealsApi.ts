import "server-only";
import { AssociationTypes } from "@hubspot/api-client";
import {
  AssociationSpecAssociationCategoryEnum,
  FilterOperatorEnum,
} from "@hubspot/api-client/lib/codegen/crm/deals/index";
import { getHubSpotClient } from "./client";
import {
  HubSpotApiError,
  HubSpotNotFoundError,
  HubSpotRateLimitError,
} from "./contactsApi";

export type HubSpotDeal = {
  id: string;
  name: string;
  amount: string | null;
  closeDate: string | null;
  pipeline: string | null;
  stage: string | null;
  createdAt: string | null;
};

export type CreateDealInput = {
  orderId: string;
  amount: number;
  closeDateIso: string;
  contactId: string;
};

function getPipelineId(): string {
  return process.env.HUBSPOT_DEAL_PIPELINE_ID ?? "default";
}

function getStageId(): string {
  return process.env.HUBSPOT_DEAL_STAGE_ID ?? "appointmentscheduled";
}

export function dealNameForOrder(orderId: string): string {
  return `Order ${orderId}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDeal(raw: any): HubSpotDeal {
  const p = raw.properties ?? {};
  return {
    id: String(raw.id),
    name: p.dealname ?? "",
    amount: p.amount ?? null,
    closeDate: p.closedate ?? null,
    pipeline: p.pipeline ?? null,
    stage: p.dealstage ?? null,
    createdAt: p.createdate ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRetryAfterMs(err: any): number {
  const headerValue = err?.response?.headers?.["retry-after"];
  if (headerValue) {
    const seconds = parseFloat(headerValue);
    if (!isNaN(seconds)) return Math.ceil(seconds * 1000);
  }
  return 10_000;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function translateError(err: any): never {
  const status: number = err?.code ?? err?.response?.status ?? 0;
  if (status === 429) {
    throw new HubSpotRateLimitError(extractRetryAfterMs(err));
  }
  if (status === 404) {
    throw new HubSpotNotFoundError(String(err?.response?.body?.id ?? "unknown"));
  }
  if (status >= 400) {
    const message =
      err?.response?.body?.message ?? err?.message ?? "HubSpot API error";
    throw new HubSpotApiError(String(message), status);
  }
  throw err;
}

/**
 * Create a Deal associated with a Contact in a single API call.
 */
export async function createDeal(input: CreateDealInput): Promise<HubSpotDeal> {
  const client = getHubSpotClient();
  const name = dealNameForOrder(input.orderId);

  try {
    const response = await client.crm.deals.basicApi.create({
      properties: {
        dealname: name,
        amount: String(input.amount),
        closedate: input.closeDateIso,
        pipeline: getPipelineId(),
        dealstage: getStageId(),
      },
      associations: [
        {
          to: { id: input.contactId },
          types: [
            {
              associationCategory:
                AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: AssociationTypes.dealToContact,
            },
          ],
        },
      ],
    });
    return mapDeal(response);
  } catch (err) {
    translateError(err);
  }
}

/**
 * Search for a deal by exact dealname (used for partial-failure recovery).
 */
export async function searchDealByName(
  name: string,
): Promise<HubSpotDeal | null> {
  const client = getHubSpotClient();
  try {
    const response = await client.crm.deals.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "dealname",
              operator: FilterOperatorEnum.Eq,
              value: name,
            },
          ],
        },
      ],
      properties: ["dealname", "amount", "closedate", "pipeline", "dealstage", "createdate"],
      limit: 1,
      after: "0",
      sorts: [],
      query: "",
    });
    const results = response.results ?? [];
    if (results.length === 0) return null;
    return mapDeal(results[0]);
  } catch (err) {
    translateError(err);
  }
}
