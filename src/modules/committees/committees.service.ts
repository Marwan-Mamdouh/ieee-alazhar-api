import { sanityClient } from "../../config/sanity.js";
import {
  TECHNICAL_TRACK_GROUPS,
  type TechnicalTrackGroup,
} from "../../types/shared.types.js";
import type {
  Committee,
  CommitteeMemberType,
  GroupedCommittees,
  TechnicalGroupedCommittees,
} from "./committees.types.js";

const committeesService = {
  getCommittees: async (): Promise<GroupedCommittees> => {
    const query = `*[_type == "committee"] {
      _id, name, type, description, logo { asset -> { url } }
    }`;

    const result: Committee[] = await sanityClient.fetch(query);

    const initial: GroupedCommittees = {
      technical: {
        "cs-fundamentals": [],
        "software-development": [],
        "systems-and-data": [],
        engineering: [],
      },
      branding: [],
      operation: [],
    };

    const grouped = result.reduce((acc, committee) => {
      const type = committee.type as CommitteeMemberType;

      if (type === "technical") {
        groupTechnicalCommittee(acc.technical, committee);
      } else {
        (acc[type] as Committee[]).push(committee);
      }

      return acc;
    }, initial);

    // Sort each group alphabetically by name
    grouped.branding = sortAlphabetically(grouped.branding);
    grouped.operation = sortAlphabetically(grouped.operation);

    for (const key of Object.keys(grouped.technical) as TechnicalTrackGroup[]) {
      grouped.technical[key] = sortAlphabetically(grouped.technical[key]);
    }

    return grouped;
  },
};

const sortAlphabetically = (committees: Committee[]): Committee[] =>
  [...committees].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

const groupTechnicalCommittee = (
  groups: TechnicalGroupedCommittees,
  committee: Committee,
): void => {
  const normalizedName = committee.name.toLowerCase().trim();

  for (const [groupName, tracks] of Object.entries(TECHNICAL_TRACK_GROUPS) as [
    TechnicalTrackGroup,
    readonly string[],
  ][]) {
    if ((tracks as readonly string[]).includes(normalizedName)) {
      groups[groupName].push(committee);
      return;
    }
  }
  // No match — committee is waiting for admin data, silently skipped
};

export default committeesService;
