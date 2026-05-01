import { UserResponse, CareerAnchorResult } from '../types/personality';
import { questions } from '../data/questions';
import { careerAnchors } from '../data/personalityTypes';

const LETTER_TO_ANCHOR: Record<string, string> = {
  A: 'TF', B: 'GM', C: 'AU', D: 'SE',
  E: 'EC', F: 'SV', G: 'CH', H: 'LS',
};

const ANCHOR_CODES = ['TF', 'GM', 'AU', 'SE', 'EC', 'SV', 'CH', 'LS'];

export function calculateCareerAnchor(responses: UserResponse[]): CareerAnchorResult {
  // Count raw letter selections
  const counts: Record<string, number> = {};
  for (const code of ANCHOR_CODES) {
    counts[code] = 0;
  }

  for (const response of responses) {
    const anchor = LETTER_TO_ANCHOR[response.value];
    if (anchor) {
      counts[anchor]++;
    }
  }

  // Find max count
  let maxCount = 0;
  for (const code of ANCHOR_CODES) {
    if (counts[code] > maxCount) {
      maxCount = counts[code];
    }
  }

  // Find all anchors tied at max
  const topAnchors = ANCHOR_CODES.filter(code => counts[code] === maxCount);

  const primaryType = careerAnchors.find(a => a.code === topAnchors[0])!;
  const secondaryType = topAnchors.length > 1
    ? careerAnchors.find(a => a.code === topAnchors[1])!
    : null;

  const primary = topAnchors.join('+');

  return {
    type: primaryType,
    secondaryType,
    primary,
    scores: { ...counts },
    counts: { ...counts },
  };
}
