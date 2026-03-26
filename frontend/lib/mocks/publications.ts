const mockProfile = {
  __typename: "Profile" as const,
  id: "0x01",
  name: "Mock User",
  bio: "This is a mock profile for local development",
  attributes: [],
  isFollowedByMe: false,
  isFollowing: false,
  followNftAddress: null,
  metadata: null,
  isDefault: true,
  handle: "mockuser.lens",
  picture: {
    __typename: "MediaSet" as const,
    original: {
      __typename: "Media" as const,
      url: "https://placehold.co/200x200/7c3aed/white?text=:)",
      mimeType: "image/png",
      width: 200,
      height: 200,
    },
  },
  coverPicture: null,
  ownedBy: "0x0000000000000000000000000000000000000001",
  dispatcher: null,
  stats: {
    __typename: "ProfileStats" as const,
    totalFollowers: 42,
    totalFollowing: 12,
    totalPosts: 5,
    totalComments: 3,
    totalMirrors: 1,
    totalPublications: 9,
    totalCollects: 7,
  },
  followModule: null,
};

const makeMockPublication = (
  id: string,
  name: string,
  color: string,
  label: string
) => ({
  __typename: "Post" as const,
  id,
  profile: { ...mockProfile },
  stats: {
    __typename: "PublicationStats" as const,
    totalAmountOfMirrors: 2,
    totalAmountOfCollects: 5,
    totalAmountOfComments: 3,
  },
  metadata: {
    __typename: "MetadataOutput" as const,
    name,
    description: `Mock meme: ${name}`,
    content: "",
    media: [
      {
        __typename: "MediaSet" as const,
        original: {
          __typename: "Media" as const,
          url: `https://placehold.co/800x600/${color}/white?text=${encodeURIComponent(label)}`,
          mimeType: "image/png",
          width: 800,
          height: 600,
        },
      },
    ],
    attributes: [],
  },
  createdAt: "2023-10-01T12:00:00.000Z",
  collectModule: {
    __typename: "FreeCollectModuleSettings" as const,
    type: "FreeCollectModule",
    followerOnly: false,
    contractAddress: "0x0000000000000000000000000000000000000000",
  },
  referenceModule: null,
  appId: "re:meme",
  hidden: false,
  reaction: null,
  mirrors: [],
  hasCollectedByMe: false,
});

export const mockPublications = [
  makeMockPublication("0x01-0x01", "Mock Meme #1", "6366f1", "Mock+Meme+1"),
  makeMockPublication("0x01-0x02", "Mock Meme #2", "ec4899", "Mock+Meme+2"),
  makeMockPublication("0x01-0x03", "Mock Meme #3", "f59e0b", "Mock+Meme+3"),
  makeMockPublication("0x01-0x04", "Mock Meme #4", "10b981", "Mock+Meme+4"),
  makeMockPublication("0x01-0x05", "Mock Meme #5", "3b82f6", "Mock+Meme+5"),
];
