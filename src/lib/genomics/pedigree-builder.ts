/**
 * Family Pedigree Builder
 * Constructs and analyzes family health history and pedigrees
 */

import type {
  FamilyPedigree,
  FamilyMember,
  FamilyRelationship,
  FamilyCondition,
  RelationshipType,
  InheritancePattern,
} from "@/types/genomics";

/**
 * Create a new family pedigree
 */
export function createPedigree(
  patientId: string,
  title: string
): FamilyPedigree {
  const proband: FamilyMember = {
    id: crypto.randomUUID(),
    patientId,
    generation: 0,
    position: 0,
    relationship: "Self (Proband)",
    firstName: null,
    lastName: null,
    gender: "UNKNOWN",
    dateOfBirth: null,
    ageAtDiagnosis: null,
    isDeceased: false,
    ageAtDeath: null,
    causeOfDeath: null,
    isProband: true,
    isAffected: false,
    affectedConditions: [],
    carrierStatus: [],
    geneticTestResults: [],
    notes: null,
  };

  const pedigree: FamilyPedigree = {
    id: crypto.randomUUID(),
    organizationId: "",
    patientId,
    title,
    description: null,
    generations: 1,
    members: [proband],
    relationships: [],
    conditions: [],
    notes: null,
    lastUpdatedBy: "system",
    isComplete: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return pedigree;
}

/**
 * Add family member to pedigree
 */
export function addFamilyMember(
  pedigree: FamilyPedigree,
  member: Omit<FamilyMember, "id">,
  relationTo: string,
  relationType: RelationshipType
): FamilyPedigree {
  const newMember: FamilyMember = {
    ...member,
    id: crypto.randomUUID(),
  };

  // Update generations if needed
  const maxGeneration = Math.max(...pedigree.members.map((m) => m.generation));
  if (newMember.generation > maxGeneration) {
    pedigree.generations = newMember.generation + 1;
  }

  // Add relationship
  const relationship: FamilyRelationship = {
    id: crypto.randomUUID(),
    member1Id: relationTo,
    member2Id: newMember.id,
    relationshipType: relationType,
    isConsanguineous: false,
  };

  return {
    ...pedigree,
    members: [...pedigree.members, newMember],
    relationships: [...pedigree.relationships, relationship],
    updatedAt: new Date(),
  };
}

/**
 * Add condition to family pedigree
 */
export function addFamilyCondition(
  pedigree: FamilyPedigree,
  condition: Omit<FamilyCondition, "id">
): FamilyPedigree {
  const newCondition: FamilyCondition = {
    condition: condition.condition,
    icdCode: condition.icdCode,
    affectedMembers: condition.affectedMembers,
    inheritancePattern: condition.inheritancePattern,
    notes: condition.notes,
  };

  // Mark affected members
  const updatedMembers = pedigree.members.map((member) => {
    if (newCondition.affectedMembers.includes(member.id)) {
      return {
        ...member,
        isAffected: true,
        affectedConditions: [...member.affectedConditions, condition.condition],
      };
    }
    return member;
  });

  return {
    ...pedigree,
    members: updatedMembers,
    conditions: [...pedigree.conditions, newCondition],
    updatedAt: new Date(),
  };
}

/**
 * Analyze inheritance pattern from pedigree
 */
export function analyzeInheritancePattern(
  pedigree: FamilyPedigree,
  condition: string
): {
  pattern: InheritancePattern | null;
  confidence: number;
  evidence: string[];
} {
  const familyCondition = pedigree.conditions.find((c) => c.condition === condition);

  if (!familyCondition) {
    return {
      pattern: null,
      confidence: 0,
      evidence: ["Condition not found in pedigree"],
    };
  }

  const affectedMembers = pedigree.members.filter((m) =>
    familyCondition.affectedMembers.includes(m.id)
  );

  const evidence: string[] = [];
  let pattern: InheritancePattern | null = null;
  let confidence = 0;

  // Check for autosomal dominant
  const hasMultipleGenerations = checkMultipleGenerations(affectedMembers);
  const hasMaleToMaleTransmission = checkMaleToMaleTransmission(
    pedigree,
    affectedMembers
  );
  const hasAffectedInEveryGeneration = checkConsecutiveGenerations(
    pedigree,
    affectedMembers
  );

  if (hasMultipleGenerations && hasMaleToMaleTransmission) {
    pattern = "AUTOSOMAL_DOMINANT";
    confidence = 0.8;
    evidence.push("Multiple generations affected");
    evidence.push("Male-to-male transmission present");

    if (hasAffectedInEveryGeneration) {
      confidence = 0.9;
      evidence.push("Affected individuals in consecutive generations");
    }
  }

  // Check for autosomal recessive
  const hasSiblings = checkAffectedSiblings(pedigree, affectedMembers);
  const hasConsanguinity = checkConsanguinity(pedigree);
  const hasUnaffectedParents = checkUnaffectedParents(pedigree, affectedMembers);

  if (hasSiblings && hasUnaffectedParents) {
    pattern = "AUTOSOMAL_RECESSIVE";
    confidence = 0.7;
    evidence.push("Affected siblings with unaffected parents");

    if (hasConsanguinity) {
      confidence = 0.85;
      evidence.push("Consanguineous union present");
    }
  }

  // Check for X-linked
  const hasOnlyMalesAffected = checkOnlyMalesAffected(affectedMembers);
  const hasAffectedMalesMaternalLine = checkMaternalLineTransmission(
    pedigree,
    affectedMembers
  );

  if (hasOnlyMalesAffected && hasAffectedMalesMaternalLine) {
    pattern = "X_LINKED_RECESSIVE";
    confidence = 0.75;
    evidence.push("Only males affected");
    evidence.push("Transmission through maternal line");
  }

  // Check for mitochondrial
  const hasMaternalOnlyTransmission = checkMaternalOnlyTransmission(
    pedigree,
    affectedMembers
  );

  if (hasMaternalOnlyTransmission) {
    pattern = "MITOCHONDRIAL";
    confidence = 0.8;
    evidence.push("Maternal-only transmission pattern");
  }

  return {
    pattern,
    confidence,
    evidence,
  };
}

/**
 * Check if multiple generations are affected
 */
function checkMultipleGenerations(members: FamilyMember[]): boolean {
  const generations = new Set(members.map((m) => m.generation));
  return generations.size > 1;
}

/**
 * Check for male-to-male transmission
 */
function checkMaleToMaleTransmission(
  pedigree: FamilyPedigree,
  affectedMembers: FamilyMember[]
): boolean {
  for (const member of affectedMembers) {
    if (member.gender === "MALE") {
      // Check if father is affected
      const parentRelationships = pedigree.relationships.filter(
        (r) =>
          r.member2Id === member.id && r.relationshipType === "PARENT_CHILD"
      );

      for (const rel of parentRelationships) {
        const parent = pedigree.members.find((m) => m.id === rel.member1Id);
        if (parent?.gender === "MALE" && parent.isAffected) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check for consecutive generations
 */
function checkConsecutiveGenerations(
  pedigree: FamilyPedigree,
  affectedMembers: FamilyMember[]
): boolean {
  const generations = affectedMembers
    .map((m) => m.generation)
    .sort((a, b) => a - b);

  for (let i = 0; i < generations.length - 1; i++) {
    if (generations[i + 1] - generations[i] !== 1) {
      return false;
    }
  }

  return generations.length > 1;
}

/**
 * Check for affected siblings
 */
function checkAffectedSiblings(
  pedigree: FamilyPedigree,
  affectedMembers: FamilyMember[]
): boolean {
  const siblingRelationships = pedigree.relationships.filter(
    (r) => r.relationshipType === "SIBLINGS"
  );

  for (const rel of siblingRelationships) {
    const member1Affected = affectedMembers.some((m) => m.id === rel.member1Id);
    const member2Affected = affectedMembers.some((m) => m.id === rel.member2Id);

    if (member1Affected && member2Affected) {
      return true;
    }
  }

  return false;
}

/**
 * Check for consanguinity
 */
function checkConsanguinity(pedigree: FamilyPedigree): boolean {
  return pedigree.relationships.some((r) => r.isConsanguineous);
}

/**
 * Check for unaffected parents
 */
function checkUnaffectedParents(
  pedigree: FamilyPedigree,
  affectedMembers: FamilyMember[]
): boolean {
  for (const member of affectedMembers) {
    const parentRelationships = pedigree.relationships.filter(
      (r) => r.member2Id === member.id && r.relationshipType === "PARENT_CHILD"
    );

    let hasUnaffectedParent = false;
    for (const rel of parentRelationships) {
      const parent = pedigree.members.find((m) => m.id === rel.member1Id);
      if (parent && !parent.isAffected) {
        hasUnaffectedParent = true;
        break;
      }
    }

    if (hasUnaffectedParent) {
      return true;
    }
  }

  return false;
}

/**
 * Check if only males are affected
 */
function checkOnlyMalesAffected(members: FamilyMember[]): boolean {
  return members.every((m) => m.gender === "MALE");
}

/**
 * Check for maternal line transmission
 */
function checkMaternalLineTransmission(
  pedigree: FamilyPedigree,
  affectedMembers: FamilyMember[]
): boolean {
  for (const member of affectedMembers) {
    if (member.gender === "MALE") {
      const parentRelationships = pedigree.relationships.filter(
        (r) =>
          r.member2Id === member.id && r.relationshipType === "PARENT_CHILD"
      );

      for (const rel of parentRelationships) {
        const parent = pedigree.members.find((m) => m.id === rel.member1Id);
        if (parent?.gender === "FEMALE") {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check for maternal-only transmission
 */
function checkMaternalOnlyTransmission(
  pedigree: FamilyPedigree,
  affectedMembers: FamilyMember[]
): boolean {
  let hasMaternalTransmission = false;
  let hasPaternalTransmission = false;

  for (const member of affectedMembers) {
    const parentRelationships = pedigree.relationships.filter(
      (r) => r.member2Id === member.id && r.relationshipType === "PARENT_CHILD"
    );

    for (const rel of parentRelationships) {
      const parent = pedigree.members.find((m) => m.id === rel.member1Id);

      if (parent?.isAffected) {
        if (parent.gender === "FEMALE") {
          hasMaternalTransmission = true;
        } else if (parent.gender === "MALE") {
          hasPaternalTransmission = true;
        }
      }
    }
  }

  return hasMaternalTransmission && !hasPaternalTransmission;
}

/**
 * Calculate segregation ratio
 */
export function calculateSegregationRatio(
  pedigree: FamilyPedigree,
  condition: string
): {
  observed: number;
  expected: number;
  ratio: string;
} {
  const familyCondition = pedigree.conditions.find((c) => c.condition === condition);

  if (!familyCondition) {
    return {
      observed: 0,
      expected: 0,
      ratio: "N/A",
    };
  }

  const affectedCount = familyCondition.affectedMembers.length;
  const totalMembers = pedigree.members.length;

  let expected = 0;
  if (familyCondition.inheritancePattern === "AUTOSOMAL_DOMINANT") {
    expected = 0.5;
  } else if (familyCondition.inheritancePattern === "AUTOSOMAL_RECESSIVE") {
    expected = 0.25;
  }

  const observed = affectedCount / totalMembers;

  return {
    observed,
    expected,
    ratio: `${affectedCount}:${totalMembers - affectedCount}`,
  };
}

/**
 * Identify at-risk family members
 */
export function identifyAtRiskMembers(
  pedigree: FamilyPedigree,
  condition: string
): FamilyMember[] {
  const familyCondition = pedigree.conditions.find((c) => c.condition === condition);

  if (!familyCondition) {
    return [];
  }

  const atRiskMembers: FamilyMember[] = [];
  const affectedMemberIds = familyCondition.affectedMembers;

  for (const member of pedigree.members) {
    if (member.isAffected || member.isDeceased) {
      continue;
    }

    // Check if has affected relatives
    const hasAffectedRelative = pedigree.relationships.some((r) => {
      const relatedId =
        r.member1Id === member.id ? r.member2Id : r.member1Id;
      return affectedMemberIds.includes(relatedId);
    });

    if (hasAffectedRelative) {
      atRiskMembers.push(member);
    }
  }

  return atRiskMembers;
}

/**
 * Export pedigree to standard format
 */
export function exportPedigree(
  pedigree: FamilyPedigree
): {
  format: string;
  data: any;
} {
  // Export in PED format (standard pedigree format)
  const pedData = pedigree.members.map((member) => ({
    familyId: pedigree.id,
    individualId: member.id,
    paternalId: findParent(pedigree, member.id, "MALE"),
    maternalId: findParent(pedigree, member.id, "FEMALE"),
    sex: member.gender === "MALE" ? 1 : member.gender === "FEMALE" ? 2 : 0,
    phenotype: member.isAffected ? 2 : 1,
  }));

  return {
    format: "PED",
    data: pedData,
  };
}

/**
 * Find parent of specific gender
 */
function findParent(
  pedigree: FamilyPedigree,
  memberId: string,
  gender: "MALE" | "FEMALE"
): string {
  const parentRelationships = pedigree.relationships.filter(
    (r) => r.member2Id === memberId && r.relationshipType === "PARENT_CHILD"
  );

  for (const rel of parentRelationships) {
    const parent = pedigree.members.find((m) => m.id === rel.member1Id);
    if (parent?.gender === gender) {
      return parent.id;
    }
  }

  return "0"; // Unknown parent
}

export default {
  createPedigree,
  addFamilyMember,
  addFamilyCondition,
  analyzeInheritancePattern,
  calculateSegregationRatio,
  identifyAtRiskMembers,
  exportPedigree,
};
