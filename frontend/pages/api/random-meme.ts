import type { NextApiRequest, NextApiResponse } from "next";
import { getRandomMemePublication } from "../../lib/server/randomMeme";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (_req.method !== "GET") {
    res.status(405).end();
    return;
  }

  try {
    const publication = await getRandomMemePublication();
    if (!publication) {
      res.status(404).json({ publication: null });
      return;
    }
    res.status(200).json({ publication });
  } catch (_error) {
    res.status(500).json({ publication: null });
  }
}
