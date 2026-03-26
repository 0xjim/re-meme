import { ApolloLink, Observable, Operation, FetchResult } from "@apollo/client";
import {
  getMockProfiles,
  getMockPublicationById,
  getMockPublicationByTxHash,
  getShuffledMockPublications,
  mockPublications,
} from "./publications";

/**
 * Extracts the top-level field name from the query's selection set.
 * This handles anonymous queries like `query($request: ...) { explorePublications { ... } }`
 */
const getQueryFieldName = (operation: Operation): string => {
  if (operation.operationName) return operation.operationName;

  try {
    const definitions = operation.query.definitions;
    for (const def of definitions) {
      if (def.kind === "OperationDefinition" && def.selectionSet) {
        const firstSelection = def.selectionSet.selections[0];
        if (firstSelection.kind === "Field") {
          return firstSelection.name.value;
        }
      }
    }
  } catch {}
  return "";
};

const mockResolvers: Record<string, (operation: Operation) => any> = {
  explorePublications: (operation) => {
    const request = operation.variables?.request || {};
    const seed = JSON.stringify({
      sortCriteria: request.sortCriteria || "LATEST",
      timestamp: request.timestamp || 0,
      cursor: request.cursor || "",
    });
    const limit = typeof request.limit === "number" ? request.limit : undefined;
    const items = getShuffledMockPublications(seed, limit);
    return {
      explorePublications: {
        items,
        pageInfo: {
          prev: null,
          next: null,
          totalCount: mockPublications.length,
        },
      },
    };
  },

  publication: (operation) => {
    const pubId = operation.variables?.request?.publicationId as string | undefined;
    const txHash = operation.variables?.request?.txHash as string | undefined;
    const publication = txHash
      ? getMockPublicationByTxHash(txHash)
      : getMockPublicationById(pubId);
    return {
      publication,
    };
  },

  publications: (operation) => {
    const request = operation.variables?.request || {};
    const limit = typeof request.limit === "number" ? request.limit : mockPublications.length;
    const seed = JSON.stringify({
      commentsOf: request.commentsOf || "",
      sources: request.sources || [],
      cursor: request.cursor || "",
    });
    const items = getShuffledMockPublications(seed, limit);
    return {
      publications: {
        items,
        pageInfo: {
          prev: null,
          next: null,
          totalCount: mockPublications.length,
        },
      },
    };
  },

  profiles: (operation) => {
    const request = operation.variables?.request || {};
    const ownedBy = request.ownedBy as string | undefined;
    return {
      profiles: {
        items: getMockProfiles(ownedBy),
      },
    };
  },

  challenge: () => ({
    challenge: { text: "mock-challenge-text" },
  }),

  authenticate: () => ({
    authenticate: {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    },
  }),

  refresh: () => ({
    refresh: {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    },
  }),

  enabledModuleCurrencies: () => ({
    enabledModuleCurrencies: [],
  }),

  hasTxHashBeenIndexed: () => ({
    hasTxHashBeenIndexed: {
      __typename: "TransactionIndexedResult",
      indexed: true,
      txReceipt: null,
      metadataStatus: null,
    },
  }),

  broadcast: () => ({
    broadcast: {
      __typename: "RelayerResult",
      txHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      txId: "mock-tx-id",
    },
  }),

  createPostTypedData: () => ({
    createPostTypedData: null,
  }),

  createCommentTypedData: () => ({
    createCommentTypedData: null,
  }),
};

export class MockLink extends ApolloLink {
  request(operation: Operation): Observable<FetchResult> {
    return new Observable((observer) => {
      const fieldName = getQueryFieldName(operation);
      const resolver = mockResolvers[fieldName];

      if (resolver) {
        observer.next({ data: resolver(operation) });
      } else {
        console.warn(`[MockLink] No mock for field: ${fieldName}`);
        observer.next({ data: null });
      }
      observer.complete();
    });
  }
}

export const mockLink = new MockLink();
