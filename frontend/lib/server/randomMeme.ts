import { generateApolloClient } from "../config/apollo";
import { selectedEnvironment } from "../config/environments";
import {
  ExplorePublicationsData,
  ExplorePublicationsParams,
  PublicationData,
} from "../models/Publication/publication.model";
import { EXPLORE_PUBLICATIONS } from "../queries/publication";
import { getBlacklistedFromDb } from "../../pages/api/blacklist";

const getRandomNumber = (max: number) => Math.floor(Math.random() * max);
const sortCriterias = ["TOP_COMMENTED", "TOP_COLLECTED", "LATEST"];

export const getRandomMemePublication = async (
  excludePublicationId?: string,
): Promise<PublicationData | null> => {
  const client = generateApolloClient();
  const { data } = await client.query<ExplorePublicationsData, ExplorePublicationsParams>({
    query: EXPLORE_PUBLICATIONS,
    variables: {
      request: {
        sortCriteria: sortCriterias[getRandomNumber(sortCriterias.length)],
        sources: [selectedEnvironment.appId],
        limit: 50,
        timestamp: selectedEnvironment.startMemesTimestamp,
        publicationTypes: ["COMMENT", "POST"],
      },
    },
  });

  const items = data.explorePublications.items;
  if (!items.length) return null;

  let selectedPublication = items[getRandomNumber(items.length)];
  let attempts = 0;
  const maxAttempts = items.length * 2;

  while (
    excludePublicationId &&
    items.length > 1 &&
    selectedPublication.id === excludePublicationId &&
    attempts < maxAttempts
  ) {
    selectedPublication = items[getRandomNumber(items.length)];
    attempts += 1;
  }

  if (!process.env.NEXT_PUBLIC_BLACKLIST_OFF) {
    let isBlacklisted = await getBlacklistedFromDb(selectedPublication.id);
    let blacklistAttempts = 0;

    while (isBlacklisted.blacklisted && blacklistAttempts < maxAttempts) {
      selectedPublication = items[getRandomNumber(items.length)];
      if (excludePublicationId && items.length > 1 && selectedPublication.id === excludePublicationId) {
        blacklistAttempts += 1;
        continue;
      }
      isBlacklisted = await getBlacklistedFromDb(selectedPublication.id);
      blacklistAttempts += 1;
    }
  }

  return selectedPublication;
};
