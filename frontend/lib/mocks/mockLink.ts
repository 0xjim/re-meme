import { ApolloLink, Observable, Operation, FetchResult } from "@apollo/client";
import { mockPublications } from "./publications";

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
  explorePublications: () => ({
    explorePublications: {
      items: mockPublications,
      pageInfo: {
        prev: null,
        next: null,
        totalCount: mockPublications.length,
      },
    },
  }),

  publication: (operation) => {
    const pubId = operation.variables?.request?.publicationId;
    const txHash = operation.variables?.request?.txHash;
    const found =
      mockPublications.find((p) => p.id === pubId) || mockPublications[0];
    return {
      publication: txHash ? mockPublications[0] : found,
    };
  },

  publications: () => ({
    publications: {
      items: [],
      pageInfo: {
        prev: null,
        next: null,
        totalCount: 0,
      },
    },
  }),

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

  profiles: () => ({
    profiles: {
      items: [],
    },
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
