export const TECHNICAL_TRACK_GROUPS = {
  "cs-fundamentals": [
    "c language",
    "python",
    "java",
    "problem solving",
    "advanced programming",
  ],
  "software-development": ["front end", "back end", "ui/ux", "flutter"],
  "systems-and-data": [
    "ai",
    "data science",
    "cloud & devops",
    "software testing",
    "cyber security",
    "network",
  ],
  engineering: [
    "embedded systems",
    "robotics",
    "power distribution",
    "scientific research",
  ],
} as const;

export type TechnicalTrackGroup = keyof typeof TECHNICAL_TRACK_GROUPS;
