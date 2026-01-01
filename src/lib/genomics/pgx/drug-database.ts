/**
 * Pharmacogenomics Drug Database
 * Comprehensive database of drug-gene pairs with PGx evidence
 * Includes FDA labels, CPIC guidelines, and PharmGKB annotations
 */

export interface PGxDrug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string[];
  indication: string[];
  genes: PGxGeneAssociation[];
  fdaLabel: FDALabelInfo | null;
  cpicGuideline: boolean;
  pharmgkbLevel: '1A' | '1B' | '2A' | '2B' | '3' | '4' | null;
  clinicalAnnotations: ClinicalAnnotation[];
  alternatives: string[];
}

export interface PGxGeneAssociation {
  gene: string;
  level: 'required' | 'recommended' | 'informative';
  phenotypeEffect: string;
  evidenceLevel: 'high' | 'moderate' | 'low';
  references: string[];
}

export interface FDALabelInfo {
  hasPGxInfo: boolean;
  sections: string[]; // e.g., 'warnings', 'dosage', 'clinical_pharmacology'
  actionable: boolean;
  testingRecommended: boolean;
  testingRequired: boolean;
  labelUrl: string;
  lastUpdated: string;
}

export interface ClinicalAnnotation {
  gene: string;
  variantAlleles: string[];
  significance: string;
  notes: string;
  evidenceLevel: string;
  references: string[];
}

export interface DrugInteractionAlert {
  drug: string;
  gene: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  actionRequired: boolean;
  message: string;
}

export class PGxDrugDatabase {
  private static readonly DRUGS: Record<string, PGxDrug> = {
    clopidogrel: {
      id: 'PA449053',
      name: 'Clopidogrel',
      genericName: 'clopidogrel',
      brandNames: ['Plavix'],
      drugClass: ['Antiplatelet agent', 'P2Y12 inhibitor'],
      indication: [
        'Acute coronary syndrome',
        'Recent MI',
        'Recent stroke',
        'Peripheral arterial disease',
      ],
      genes: [
        {
          gene: 'CYP2C19',
          level: 'required',
          phenotypeEffect: 'Poor metabolizers have reduced platelet inhibition',
          evidenceLevel: 'high',
          references: ['PMID: 20089819', 'PMID: 21716271'],
        },
      ],
      fdaLabel: {
        hasPGxInfo: true,
        sections: ['warnings', 'clinical_pharmacology', 'boxed_warning'],
        actionable: true,
        testingRecommended: true,
        testingRequired: false,
        labelUrl: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2010/020839s044lbl.pdf',
        lastUpdated: '2010-03-12',
      },
      cpicGuideline: true,
      pharmgkbLevel: '1A',
      clinicalAnnotations: [
        {
          gene: 'CYP2C19',
          variantAlleles: ['*2', '*3', '*4', '*5', '*6', '*7', '*8'],
          significance: 'Loss of function - increased risk of cardiovascular events',
          notes: 'Alternative antiplatelet therapy recommended',
          evidenceLevel: 'Level 1A',
          references: ['CPIC Guideline'],
        },
      ],
      alternatives: ['Prasugrel', 'Ticagrelor'],
    },
    warfarin: {
      id: 'PA451906',
      name: 'Warfarin',
      genericName: 'warfarin',
      brandNames: ['Coumadin', 'Jantoven'],
      drugClass: ['Anticoagulant', 'Vitamin K antagonist'],
      indication: [
        'Atrial fibrillation',
        'DVT/PE treatment and prophylaxis',
        'Mechanical heart valve',
      ],
      genes: [
        {
          gene: 'CYP2C9',
          level: 'required',
          phenotypeEffect: 'Decreased metabolism increases bleeding risk',
          evidenceLevel: 'high',
          references: ['PMID: 17304369'],
        },
        {
          gene: 'VKORC1',
          level: 'required',
          phenotypeEffect: 'Affects warfarin sensitivity',
          evidenceLevel: 'high',
          references: ['PMID: 17304369'],
        },
        {
          gene: 'CYP4F2',
          level: 'informative',
          phenotypeEffect: 'Minor effect on dose requirements',
          evidenceLevel: 'moderate',
          references: ['PMID: 18250228'],
        },
      ],
      fdaLabel: {
        hasPGxInfo: true,
        sections: ['dosage', 'clinical_pharmacology', 'precautions'],
        actionable: true,
        testingRecommended: true,
        testingRequired: false,
        labelUrl: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2010/009218s107lbl.pdf',
        lastUpdated: '2010-08-16',
      },
      cpicGuideline: true,
      pharmgkbLevel: '1A',
      clinicalAnnotations: [
        {
          gene: 'CYP2C9',
          variantAlleles: ['*2', '*3'],
          significance: 'Decreased metabolism - use lower doses',
          notes: 'Use pharmacogenetic dosing algorithm',
          evidenceLevel: 'Level 1A',
          references: ['CPIC Guideline', 'FDA Label'],
        },
      ],
      alternatives: ['Apixaban', 'Rivaroxaban', 'Dabigatran', 'Edoxaban'],
    },
    codeine: {
      id: 'PA449088',
      name: 'Codeine',
      genericName: 'codeine',
      brandNames: ['Various combinations'],
      drugClass: ['Opioid analgesic', 'Antitussive'],
      indication: ['Mild to moderate pain', 'Cough suppression'],
      genes: [
        {
          gene: 'CYP2D6',
          level: 'required',
          phenotypeEffect: 'Converts codeine to active morphine',
          evidenceLevel: 'high',
          references: ['PMID: 22205192'],
        },
      ],
      fdaLabel: {
        hasPGxInfo: true,
        sections: ['warnings', 'contraindications', 'boxed_warning'],
        actionable: true,
        testingRecommended: true,
        testingRequired: false,
        labelUrl: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2016/022402s000lbl.pdf',
        lastUpdated: '2013-02-20',
      },
      cpicGuideline: true,
      pharmgkbLevel: '1A',
      clinicalAnnotations: [
        {
          gene: 'CYP2D6',
          variantAlleles: ['*1xN', '*2xN'],
          significance: 'Ultrarapid metabolism - toxicity risk',
          notes: 'Avoid use in ultrarapid metabolizers',
          evidenceLevel: 'Level 1A',
          references: ['CPIC Guideline', 'FDA Boxed Warning'],
        },
      ],
      alternatives: ['Morphine', 'Hydromorphone', 'Oxycodone', 'Tramadol'],
    },
    azathioprine: {
      id: 'PA448515',
      name: 'Azathioprine',
      genericName: 'azathioprine',
      brandNames: ['Imuran', 'Azasan'],
      drugClass: ['Immunosuppressant', 'Antimetabolite'],
      indication: [
        'Organ transplantation',
        'Rheumatoid arthritis',
        'Inflammatory bowel disease',
      ],
      genes: [
        {
          gene: 'TPMT',
          level: 'required',
          phenotypeEffect: 'Decreased activity increases myelosuppression risk',
          evidenceLevel: 'high',
          references: ['PMID: 21270794'],
        },
        {
          gene: 'NUDT15',
          level: 'recommended',
          phenotypeEffect: 'Decreased activity increases toxicity risk',
          evidenceLevel: 'high',
          references: ['PMID: 27064846'],
        },
      ],
      fdaLabel: {
        hasPGxInfo: true,
        sections: ['warnings', 'dosage', 'adverse_reactions', 'boxed_warning'],
        actionable: true,
        testingRecommended: true,
        testingRequired: false,
        labelUrl: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2011/016324s034lbl.pdf',
        lastUpdated: '2011-07-22',
      },
      cpicGuideline: true,
      pharmgkbLevel: '1A',
      clinicalAnnotations: [
        {
          gene: 'TPMT',
          variantAlleles: ['*2', '*3A', '*3B', '*3C'],
          significance: 'Reduced/absent activity - severe myelosuppression risk',
          notes: 'Reduce dose or use alternative',
          evidenceLevel: 'Level 1A',
          references: ['CPIC Guideline', 'FDA Boxed Warning'],
        },
      ],
      alternatives: ['Mycophenolate mofetil', 'Methotrexate', 'Cyclophosphamide'],
    },
    mercaptopurine: {
      id: 'PA450379',
      name: 'Mercaptopurine',
      genericName: 'mercaptopurine',
      brandNames: ['Purinethol'],
      drugClass: ['Antimetabolite', 'Antineoplastic'],
      indication: ['Acute lymphoblastic leukemia', 'Inflammatory bowel disease'],
      genes: [
        {
          gene: 'TPMT',
          level: 'required',
          phenotypeEffect: 'Decreased activity increases toxicity',
          evidenceLevel: 'high',
          references: ['PMID: 21270794'],
        },
        {
          gene: 'NUDT15',
          level: 'recommended',
          phenotypeEffect: 'Decreased activity increases toxicity',
          evidenceLevel: 'high',
          references: ['PMID: 27064846'],
        },
      ],
      fdaLabel: {
        hasPGxInfo: true,
        sections: ['dosage', 'warnings', 'precautions'],
        actionable: true,
        testingRecommended: true,
        testingRequired: false,
        labelUrl: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2011/009053s031lbl.pdf',
        lastUpdated: '2011-07-22',
      },
      cpicGuideline: true,
      pharmgkbLevel: '1A',
      clinicalAnnotations: [
        {
          gene: 'TPMT',
          variantAlleles: ['*2', '*3A', '*3B', '*3C'],
          significance: 'Reduced/absent activity - severe toxicity risk',
          notes: 'Reduce dose substantially',
          evidenceLevel: 'Level 1A',
          references: ['CPIC Guideline'],
        },
      ],
      alternatives: ['Methotrexate', 'Cytarabine'],
    },
    simvastatin: {
      id: 'PA451363',
      name: 'Simvastatin',
      genericName: 'simvastatin',
      brandNames: ['Zocor'],
      drugClass: ['HMG-CoA reductase inhibitor', 'Statin'],
      indication: ['Hyperlipidemia', 'Cardiovascular disease prevention'],
      genes: [
        {
          gene: 'SLCO1B1',
          level: 'required',
          phenotypeEffect: 'Decreased function increases myopathy risk',
          evidenceLevel: 'high',
          references: ['PMID: 18650507'],
        },
      ],
      fdaLabel: {
        hasPGxInfo: true,
        sections: ['warnings', 'clinical_pharmacology'],
        actionable: true,
        testingRecommended: false,
        testingRequired: false,
        labelUrl: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2014/019766s085lbl.pdf',
        lastUpdated: '2011-06-08',
      },
      cpicGuideline: true,
      pharmgkbLevel: '1A',
      clinicalAnnotations: [
        {
          gene: 'SLCO1B1',
          variantAlleles: ['*5', '*15', '*17'],
          significance: 'Decreased function - increased myopathy risk',
          notes: 'Use lower dose or alternative statin',
          evidenceLevel: 'Level 1A',
          references: ['CPIC Guideline'],
        },
      ],
      alternatives: ['Pravastatin', 'Rosuvastatin', 'Atorvastatin', 'Fluvastatin'],
    },
    abacavir: {
      id: 'PA448001',
      name: 'Abacavir',
      genericName: 'abacavir',
      brandNames: ['Ziagen'],
      drugClass: ['Nucleoside reverse transcriptase inhibitor', 'Antiretroviral'],
      indication: ['HIV infection'],
      genes: [
        {
          gene: 'HLA-B',
          level: 'required',
          phenotypeEffect: 'HLA-B*57:01 causes hypersensitivity reaction',
          evidenceLevel: 'high',
          references: ['PMID: 18256392'],
        },
      ],
      fdaLabel: {
        hasPGxInfo: true,
        sections: ['contraindications', 'warnings', 'boxed_warning'],
        actionable: true,
        testingRecommended: true,
        testingRequired: true,
        labelUrl: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2008/020977s019lbl.pdf',
        lastUpdated: '2008-07-24',
      },
      cpicGuideline: true,
      pharmgkbLevel: '1A',
      clinicalAnnotations: [
        {
          gene: 'HLA-B',
          variantAlleles: ['*57:01'],
          significance: 'Hypersensitivity reaction - contraindicated',
          notes: 'Do not use if HLA-B*57:01 positive',
          evidenceLevel: 'Level 1A',
          references: ['CPIC Guideline', 'FDA Boxed Warning'],
        },
      ],
      alternatives: ['Tenofovir', 'Zidovudine', 'Lamivudine'],
    },
  };

  /**
   * Get drug information
   */
  static getDrug(drugName: string): PGxDrug | null {
    return this.DRUGS[drugName.toLowerCase()] || null;
  }

  /**
   * Search drugs by name (partial match)
   */
  static searchDrugs(query: string): PGxDrug[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(this.DRUGS).filter(
      (drug) =>
        drug.name.toLowerCase().includes(lowerQuery) ||
        drug.genericName.toLowerCase().includes(lowerQuery) ||
        drug.brandNames.some((brand) => brand.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get drugs by gene
   */
  static getDrugsByGene(gene: string): PGxDrug[] {
    return Object.values(this.DRUGS).filter((drug) =>
      drug.genes.some((g) => g.gene === gene)
    );
  }

  /**
   * Get drugs with FDA PGx labeling
   */
  static getDrugsWithFDALabel(): PGxDrug[] {
    return Object.values(this.DRUGS).filter(
      (drug) => drug.fdaLabel?.hasPGxInfo === true
    );
  }

  /**
   * Get drugs with CPIC guidelines
   */
  static getDrugsWithCPICGuideline(): PGxDrug[] {
    return Object.values(this.DRUGS).filter((drug) => drug.cpicGuideline === true);
  }

  /**
   * Get drugs by drug class
   */
  static getDrugsByClass(drugClass: string): PGxDrug[] {
    return Object.values(this.DRUGS).filter((drug) =>
      drug.drugClass.some((c) => c.toLowerCase().includes(drugClass.toLowerCase()))
    );
  }

  /**
   * Get all supported drugs
   */
  static getAllDrugs(): PGxDrug[] {
    return Object.values(this.DRUGS);
  }

  /**
   * Check if drug requires PGx testing
   */
  static requiresTesting(drugName: string): boolean {
    const drug = this.getDrug(drugName);
    return drug?.fdaLabel?.testingRequired === true ||
           drug?.fdaLabel?.testingRecommended === true ||
           false;
  }

  /**
   * Get gene-drug pairs requiring action
   */
  static getActionableGeneDrugPairs(): Array<{ gene: string; drug: string; level: string }> {
    const pairs: Array<{ gene: string; drug: string; level: string }> = [];

    for (const drug of Object.values(this.DRUGS)) {
      for (const geneAssoc of drug.genes) {
        if (geneAssoc.level === 'required' || geneAssoc.level === 'recommended') {
          pairs.push({
            gene: geneAssoc.gene,
            drug: drug.name,
            level: geneAssoc.level,
          });
        }
      }
    }

    return pairs;
  }

  /**
   * Get PharmGKB Level 1A drugs (highest evidence)
   */
  static getLevel1ADrugs(): PGxDrug[] {
    return Object.values(this.DRUGS).filter((drug) => drug.pharmgkbLevel === '1A');
  }

  /**
   * Generate drug information summary
   */
  static generateDrugSummary(drugName: string): string | null {
    const drug = this.getDrug(drugName);
    if (!drug) return null;

    const lines: string[] = [];

    lines.push(`=== ${drug.name} (${drug.genericName}) ===`);
    lines.push(`Brand Names: ${drug.brandNames.join(', ')}`);
    lines.push(`Drug Class: ${drug.drugClass.join(', ')}`);
    lines.push(`Indications: ${drug.indication.join(', ')}`);
    lines.push('');

    lines.push('Pharmacogenomic Information:');
    for (const gene of drug.genes) {
      lines.push(`  ${gene.gene} (${gene.level}):`);
      lines.push(`    Effect: ${gene.phenotypeEffect}`);
      lines.push(`    Evidence: ${gene.evidenceLevel}`);
    }
    lines.push('');

    if (drug.fdaLabel?.hasPGxInfo) {
      lines.push('FDA Label:');
      lines.push(`  PGx Information: Yes`);
      lines.push(`  Testing Recommended: ${drug.fdaLabel.testingRecommended ? 'Yes' : 'No'}`);
      lines.push(`  Testing Required: ${drug.fdaLabel.testingRequired ? 'Yes' : 'No'}`);
      lines.push(`  Sections: ${drug.fdaLabel.sections.join(', ')}`);
      lines.push('');
    }

    if (drug.cpicGuideline) {
      lines.push('CPIC Guideline: Available');
      lines.push('');
    }

    if (drug.alternatives.length > 0) {
      lines.push(`Alternative Medications: ${drug.alternatives.join(', ')}`);
    }

    return lines.join('\n');
  }
}
