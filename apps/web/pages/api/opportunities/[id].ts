import type { NextApiRequest, NextApiResponse } from "next";
import { realDataAdapter } from "@/lib/adapters/real";
import { getMockOpportunityById } from "@/lib/mock/opportunities";
import type { CardOpportunity } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ item: CardOpportunity } | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;
  const oppId = Array.isArray(id) ? id[0] : id;

  try {
    if (!oppId) {
      return res.status(400).json({ error: "Missing id" });
    }
    try {
      const item = await realDataAdapter.fetchOpportunityById(oppId);
      if (!item) {
        return res.status(404).json({ error: "Not found" });
      }
      const typed = item as CardOpportunity;
      return res.status(200).json({ item: { ...typed, source: "live" } });
    } catch (adapterError) {
      console.error(
        `[API /opportunities/${oppId}] Real data fetch failed, trying mock`,
        adapterError,
      );

      const mock = getMockOpportunityById(oppId);
      if (!mock) {
        return res.status(500).json({
          error:
            adapterError instanceof Error
              ? adapterError.message
              : "Unknown error",
        });
      }

      return res.status(200).json({ item: { ...mock, source: "demo" } });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
