import manifest from "../../public/assets/mock-memes/manifest.json";

const profileTemplates = [
  {
    id: "0x01",
    name: "Meme Archivist",
    handle: "archivist.lens",
    bio: "Curating canonical memes and remix lore",
    avatar: "/assets/icons/profile.svg",
    ownedBy: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "0x02",
    name: "Dank Engineer",
    handle: "dankeng.lens",
    bio: "Building meme infra one shitpost at a time",
    avatar: "/assets/imgs/punk.png",
    ownedBy: "0x0000000000000000000000000000000000000002",
  },
  {
    id: "0x03",
    name: "Loop Dealer",
    handle: "loopdealer.lens",
    bio: "Chronically online. Professionally unhinged.",
    avatar: "/assets/icons/profile.svg",
    ownedBy: "0x0000000000000000000000000000000000000003",
  },
  {
    id: "0x04",
    name: "Reply Goblin",
    handle: "goblin.lens",
    bio: "Farming replies with low effort and high conviction",
    avatar: "/assets/imgs/crazy.png",
    ownedBy: "0x0000000000000000000000000000000000000004",
  },
  {
    id: "0x05",
    name: "Chart Poster",
    handle: "chartposter.lens",
    bio: "Converts every market candle into a meme",
    avatar: "/assets/icons/profile.svg",
    ownedBy: "0x0000000000000000000000000000000000000005",
  },
  {
    id: "0x06",
    name: "Vibe Curator",
    handle: "vibecurator.lens",
    bio: "Only bangers. Never mid.",
    avatar: "/assets/imgs/punk.png",
    ownedBy: "0x0000000000000000000000000000000000000006",
  },
  {
    id: "0x07",
    name: "Gas Optimizer",
    handle: "gasmaxi.lens",
    bio: "Optimizing bytes and ratioing timelines",
    avatar: "/assets/icons/profile.svg",
    ownedBy: "0x0000000000000000000000000000000000000007",
  },
  {
    id: "0x08",
    name: "Culture Miner",
    handle: "cultureminer.lens",
    bio: "Digging for internet artifacts",
    avatar: "/assets/imgs/crazy.png",
    ownedBy: "0x0000000000000000000000000000000000000008",
  },
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const seededShuffle = <T,>(items: T[], seed: string): T[] => {
  const copy = [...items];
  let state = hashString(seed) || 1;

  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const toMediaSet = (url: string, mimeType = "image/png") => ({
  __typename: "MediaSet" as const,
  original: {
    __typename: "Media" as const,
    url,
    mimeType,
    width: 556,
    height: 396,
  },
});

const toProfile = (template: (typeof profileTemplates)[number], index: number) => ({
  __typename: "Profile" as const,
  id: template.id,
  name: template.name,
  bio: template.bio,
  attributes: [],
  isFollowedByMe: false,
  isFollowing: false,
  followNftAddress: null,
  metadata: null,
  isDefault: index % 3 === 0,
  handle: template.handle,
  picture: toMediaSet(template.avatar),
  coverPicture: null,
  ownedBy: template.ownedBy,
  dispatcher: null,
  stats: {
    __typename: "ProfileStats" as const,
    totalFollowers: 80 + index * 17,
    totalFollowing: 12 + (index % 8),
    totalPosts: 10 + index,
    totalComments: 6 + (index % 12),
    totalMirrors: 4 + (index % 7),
    totalPublications: 24 + index * 2,
    totalCollects: 16 + index * 3,
    publicationsTotal: 12 + index,
    commentsTotal: 9 + (index % 6),
  },
  followModule: null,
});

const baseTime = Date.parse("2025-12-01T12:00:00.000Z");

const curatedMockMemes = manifest.items;

const extraTemplateMemes = [
  {
    template: "Office Chaos Template",
    file: "meme-26.png",
    captions: [
      "When QA finds one more edge case",
      "POV: sprint ends in 10 minutes",
      "Fix one bug, summon three more",
      "Production is calm until deploy",
      "Status page speedrun any%",
    ],
  },
  {
    template: "Distracted Roadmap Template",
    file: "meme-27.png",
    captions: [
      "You: focus. Also you: new shiny feature",
      "Planned scope vs weekend hack idea",
      "Roadmap says refactor, brain says rewrite",
      "Small patch turned full migration",
      "Backlog triage but memes first",
    ],
  },
  {
    template: "Merge Queue Template",
    file: "meme-28.png",
    captions: [
      "CI green for everyone except me",
      "Rebase complete, conflicts undefeated",
      "One tiny PR, forty comments",
      "Approvals collected like infinity stones",
      "Squash and pray",
    ],
  },
  {
    template: "Standup Energy Template",
    file: "meme-29.png",
    captions: [
      "Yesterday: meetings. Today: meetings.",
      "Blocked by unclear requirements again",
      "No blockers (that I can admit)",
      "ETA depends on unknown unknowns",
      "We can ship after one quick test",
    ],
  },
  {
    template: "Launch Day Template",
    file: "meme-30.png",
    captions: [
      "Feature flag ON and heart rate UP",
      "Traffic spike detected. So is panic.",
      "Hotfix in review while announcement posts",
      "Rollback button looking extra beautiful",
      "We did it live",
    ],
  },
  {
    template: "Man of Culture Template",
    file: "https://i.imgflip.com/ange38.jpg",
    captions: [
      "Ah, I see you're a man of culture as well",
      "When the code review comments are actually useful",
      "When someone documents the edge cases first",
      "When the hotfix works on first deploy",
      "When tests fail for a real reason",
    ],
  },
];

const generatedTemplateCaptionMemes = extraTemplateMemes.flatMap((templateMeme) =>
  templateMeme.captions.map((caption) => ({
    file: templateMeme.file,
    title: caption,
    template: templateMeme.template,
  })),
);

const allMockMemes = [...curatedMockMemes, ...generatedTemplateCaptionMemes];

const toMockMediaUrl = (file: string) =>
  file.startsWith("http://") || file.startsWith("https://")
    ? file
    : `/assets/mock-memes/${file}`;

const mockPublicationRecords = allMockMemes.map((entry, index) => {
  const profileTemplate = profileTemplates[index % profileTemplates.length];
  const createdAt = new Date(baseTime - index * 1000 * 60 * 60 * 29).toISOString();
  const idSuffix = (index + 1).toString(16).padStart(2, "0");
  const title = entry.title;

  return {
    __typename: "Post" as const,
    id: `0x${profileTemplate.id.slice(2)}-0x${idSuffix}`,
    profile: toProfile(profileTemplate, index),
    stats: {
      __typename: "PublicationStats" as const,
      totalAmountOfMirrors: 3 + (index % 14),
      totalAmountOfCollects: 8 + ((index * 3) % 37),
      totalAmountOfComments: 2 + ((index * 5) % 41),
    },
    metadata: {
      __typename: "MetadataOutput" as const,
      name: title,
      description: `Mock meme set: ${title}`,
      content: title,
      media: [
        {
          __typename: "MediaSet" as const,
          original: {
            __typename: "Media" as const,
            url: toMockMediaUrl(entry.file),
            mimeType: entry.file.endsWith(".jpg") || entry.file.endsWith(".jpeg") ? "image/jpeg" : "image/png",
            width: 556,
            height: 396,
          },
        },
      ],
      attributes: [
        {
          displayType: "string",
          traitType: "category",
          key: "category",
          value: index % 2 === 0 ? "dev" : "culture",
        },
        {
          displayType: "string",
          traitType: "template",
          key: "template",
          value: entry.template || "default",
        },
      ],
    },
    createdAt,
    collectModule: {
      __typename: "FreeCollectModuleSettings" as const,
      type: "FreeCollectModule",
      followerOnly: index % 4 === 0,
      contractAddress: "0x0000000000000000000000000000000000000000",
    },
    referenceModule: null,
    appId: "re:meme",
    hidden: false,
    reaction: null,
    mirrors: [],
    hasCollectedByMe: false,
  };
});

export const mockPublications = mockPublicationRecords;

export const getShuffledMockPublications = (seed: string, limit?: number) => {
  const shuffled = seededShuffle(mockPublicationRecords, seed);
  if (!limit || limit <= 0) return shuffled;
  return shuffled.slice(0, Math.min(limit, shuffled.length));
};

export const getMockPublicationById = (id?: string) => {
  if (!id) return mockPublicationRecords[0];
  return mockPublicationRecords.find((p) => p.id === id) || mockPublicationRecords[0];
};

export const getMockPublicationByTxHash = (txHash?: string) => {
  if (!txHash) return mockPublicationRecords[0];
  const index = hashString(txHash) % mockPublicationRecords.length;
  return mockPublicationRecords[index];
};

export const mockProfiles = profileTemplates.map((template, index) => toProfile(template, index));

export const getMockProfiles = (ownedBy?: string) => {
  if (!ownedBy) return mockProfiles;
  const forAddress = toProfile(
    {
      id: "0x99",
      name: "Local Mock User",
      handle: "localmock.lens",
      bio: "Generated local profile for development",
      avatar: "/assets/icons/profile.svg",
      ownedBy,
    },
    99,
  );

  return [forAddress, ...mockProfiles];
};

export const getMockMemePreviews = (limit = 3) => {
  const shuffled = seededShuffle(mockPublicationRecords, "profile-previews");
  const selected = [];
  const seenMediaUrls = new Set<string>();

  for (const publication of shuffled) {
    const mediaUrl = publication.metadata.media[0].original.url;
    if (!seenMediaUrls.has(mediaUrl)) {
      seenMediaUrls.add(mediaUrl);
      selected.push(publication);
    }
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    for (const publication of shuffled) {
      if (!selected.includes(publication)) {
        selected.push(publication);
      }
      if (selected.length >= limit) break;
    }
  }

  return selected.map((publication) => ({
    id: publication.id,
    src: publication.metadata.media[0].original.url,
    remixCount: publication.stats.totalAmountOfComments,
    publicationDate: publication.createdAt,
  }));
};
