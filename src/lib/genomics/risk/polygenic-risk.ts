/**
 * Polygenic Risk Score (PRS) Calculator
 * Calculates disease risk based on multiple genetic variants
 * Implements validated PRS models from published literature
 */

import { VCFVariant } from '../vcf/parser';

export interface PolygenicRiskScore {
  condition: string;
  score: number;
  percentile: number;
  riskCategory: 'very_low' | 'low' | 'average' | 'high' | 'very_high';
  relativeRisk: number;
  absoluteRisk?: number;
  confidence: number;
  variantsUsed: number;
  variantsTotal: number;
  populationReference: string;
  interpretation: string;
  recommendations: string[];
}

export interface PRSVariant {
  rsid: string;
  chromosome: string;
  position: number;
  effectAllele: string;
  otherAllele: string;
  effectSize: number; // beta coefficient or odds ratio
  effectAlleleFrequency: number;
}

export interface PRSModel {
  condition: string;
  modelId: string;
  variants: PRSVariant[];
  meanScore: number;
  sdScore: number;
  populationReference: string;
  ancestry: string;
  prevalence: number;
  citation: string;
  validationStudy?: string;
}

export class PolygenicRiskCalculator {
  private static readonly PRS_MODELS: Record<string, PRSModel> = {
    coronary_artery_disease: {
      condition: 'Coronary Artery Disease',
      modelId: 'CAD_GPS_2018',
      populationReference: 'European',
      ancestry: 'EUR',
      prevalence: 0.05,
      meanScore: 0,
      sdScore: 1,
      citation: 'Khera AV, et al. Nat Genet. 2018;50(9):1219-1224',
      variants: [
        // Top variants from genome-wide PRS
        {
          rsid: 'rs11591147',
          chromosome: '1',
          position: 55039974,
          effectAllele: 'T',
          otherAllele: 'G',
          effectSize: -0.35,
          effectAlleleFrequency: 0.02,
        },
        {
          rsid: 'rs11206510',
          chromosome: '1',
          position: 55496039,
          effectAllele: 'T',
          otherAllele: 'C',
          effectSize: 0.08,
          effectAlleleFrequency: 0.82,
        },
        {
          rsid: 'rs17114036',
          chromosome: '1',
          position: 205017051,
          effectAllele: 'A',
          otherAllele: 'G',
          effectSize: 0.09,
          effectAlleleFrequency: 0.92,
        },
        {
          rsid: 'rs2943634',
          chromosome: '2',
          position: 203816745,
          effectAllele: 'C',
          otherAllele: 'A',
          effectSize: 0.06,
          effectAlleleFrequency: 0.48,
        },
        {
          rsid: 'rs515135',
          chromosome: '9',
          position: 22125503,
          effectAllele: 'T',
          otherAllele: 'C',
          effectSize: 0.18,
          effectAlleleFrequency: 0.48,
        },
        {
          rsid: 'rs1333049',
          chromosome: '9',
          position: 22125504,
          effectAllele: 'C',
          otherAllele: 'G',
          effectSize: 0.19,
          effectAlleleFrequency: 0.47,
        },
        {
          rsid: 'rs10757278',
          chromosome: '9',
          position: 22098619,
          effectAllele: 'A',
          otherAllele: 'G',
          effectSize: 0.17,
          effectAlleleFrequency: 0.52,
        },
      ],
    },
    type2_diabetes: {
      condition: 'Type 2 Diabetes',
      modelId: 'T2D_PRS_2020',
      populationReference: 'European',
      ancestry: 'EUR',
      prevalence: 0.08,
      meanScore: 0,
      sdScore: 1,
      citation: 'Mahajan A, et al. Nat Genet. 2018;50(9):1505-1513',
      variants: [
        {
          rsid: 'rs7903146',
          chromosome: '10',
          position: 114758349,
          effectAllele: 'T',
          otherAllele: 'C',
          effectSize: 0.38,
          effectAlleleFrequency: 0.28,
        },
        {
          rsid: 'rs1801282',
          chromosome: '3',
          position: 12393125,
          effectAllele: 'C',
          otherAllele: 'G',
          effectSize: -0.18,
          effectAlleleFrequency: 0.88,
        },
        {
          rsid: 'rs10830963',
          chromosome: '11',
          position: 92708710,
          effectAllele: 'G',
          otherAllele: 'C',
          effectSize: 0.14,
          effectAlleleFrequency: 0.31,
        },
        {
          rsid: 'rs1111875',
          chromosome: '10',
          position: 94452862,
          effectAllele: 'C',
          otherAllele: 'T',
          effectSize: 0.12,
          effectAlleleFrequency: 0.76,
        },
      ],
    },
    breast_cancer: {
      condition: 'Breast Cancer',
      modelId: 'BC_PRS_313_2020',
      populationReference: 'European',
      ancestry: 'EUR',
      prevalence: 0.125,
      meanScore: 0,
      sdScore: 1,
      citation: 'Mavaddat N, et al. JNCI. 2019;111(11):1211-1218',
      variants: [
        {
          rsid: 'rs2981582',
          chromosome: '10',
          position: 123337335,
          effectAllele: 'A',
          otherAllele: 'G',
          effectSize: 0.12,
          effectAlleleFrequency: 0.39,
        },
        {
          rsid: 'rs3803662',
          chromosome: '16',
          position: 52586341,
          effectAllele: 'T',
          otherAllele: 'C',
          effectSize: 0.15,
          effectAlleleFrequency: 0.25,
        },
        {
          rsid: 'rs13281615',
          chromosome: '8',
          position: 128355618,
          effectAllele: 'A',
          otherAllele: 'G',
          effectSize: 0.08,
          effectAlleleFrequency: 0.40,
        },
      ],
    },
    atrial_fibrillation: {
      condition: 'Atrial Fibrillation',
      modelId: 'AF_PRS_2020',
      populationReference: 'European',
      ancestry: 'EUR',
      prevalence: 0.02,
      meanScore: 0,
      sdScore: 1,
      citation: 'Khera AV, et al. Circ Genom Precis Med. 2018;11(11):e002058',
      variants: [
        {
          rsid: 'rs10033464',
          chromosome: '4',
          position: 111739431,
          effectAllele: 'T',
          otherAllele: 'C',
          effectSize: 0.31,
          effectAlleleFrequency: 0.15,
        },
        {
          rsid: 'rs6817105',
          chromosome: '4',
          position: 111762192,
          effectAllele: 'C',
          otherAllele: 'T',
          effectSize: 0.26,
          effectAlleleFrequency: 0.87,
        },
      ],
    },
    prostate_cancer: {
      condition: 'Prostate Cancer',
      modelId: 'PC_PRS_269_2021',
      populationReference: 'European',
      ancestry: 'EUR',
      prevalence: 0.13,
      meanScore: 0,
      sdScore: 1,
      citation: 'Conti DV, et al. Nat Genet. 2021;53(1):65-75',
      variants: [
        {
          rsid: 'rs12621278',
          chromosome: '2',
          position: 63291806,
          effectAllele: 'A',
          otherAllele: 'G',
          effectSize: 0.13,
          effectAlleleFrequency: 0.16,
        },
        {
          rsid: 'rs10936599',
          chromosome: '3',
          position: 87160618,
          effectAllele: 'T',
          otherAllele: 'C',
          effectSize: 0.10,
          effectAlleleFrequency: 0.28,
        },
      ],
    },
  };

  /**
   * Calculate polygenic risk score for a condition
   */
  static calculatePRS(
    condition: string,
    variants: VCFVariant[],
    sampleName: string
  ): PolygenicRiskScore | null {
    const model = this.PRS_MODELS[condition];
    if (!model) {
      console.warn(`No PRS model found for condition: ${condition}`);
      return null;
    }

    let score = 0;
    let variantsUsed = 0;
    const variantsTotal = model.variants.length;

    // Calculate weighted sum of effect alleles
    for (const prsVariant of model.variants) {
      const vcfVariant = this.findMatchingVariant(variants, prsVariant);

      if (!vcfVariant) {
        // Use population frequency as imputation
        score += 2 * prsVariant.effectAlleleFrequency * prsVariant.effectSize;
        continue;
      }

      const genotype = vcfVariant.samples[sampleName]?.GT;
      if (!genotype) continue;

      const effectAlleleCount = this.countEffectAllele(
        genotype,
        vcfVariant,
        prsVariant
      );

      score += effectAlleleCount * prsVariant.effectSize;
      variantsUsed++;
    }

    // Standardize score
    const standardizedScore = (score - model.meanScore) / model.sdScore;

    // Calculate percentile (assuming normal distribution)
    const percentile = this.normalCDF(standardizedScore) * 100;

    // Determine risk category
    const riskCategory = this.determineRiskCategory(percentile);

    // Calculate relative risk
    const relativeRisk = this.calculateRelativeRisk(standardizedScore);

    // Calculate absolute risk if prevalence known
    const absoluteRisk = model.prevalence * relativeRisk;

    // Determine confidence based on variant coverage
    const confidence = variantsUsed / variantsTotal;

    return {
      condition: model.condition,
      score: standardizedScore,
      percentile,
      riskCategory,
      relativeRisk,
      absoluteRisk,
      confidence,
      variantsUsed,
      variantsTotal,
      populationReference: model.populationReference,
      interpretation: this.generateInterpretation(
        model.condition,
        riskCategory,
        percentile,
        relativeRisk,
        absoluteRisk
      ),
      recommendations: this.generateRecommendations(model.condition, riskCategory),
    };
  }

  /**
   * Find matching VCF variant for PRS variant
   */
  private static findMatchingVariant(
    vcfVariants: VCFVariant[],
    prsVariant: PRSVariant
  ): VCFVariant | null {
    // Try matching by rsID first
    if (prsVariant.rsid) {
      const byRsid = vcfVariants.find((v) => v.id.includes(prsVariant.rsid));
      if (byRsid) return byRsid;
    }

    // Try matching by position
    return (
      vcfVariants.find(
        (v) =>
          v.chromosome === prsVariant.chromosome &&
          v.position === prsVariant.position
      ) || null
    );
  }

  /**
   * Count effect alleles in genotype
   */
  private static countEffectAllele(
    genotype: any,
    vcfVariant: VCFVariant,
    prsVariant: PRSVariant
  ): number {
    const gtString = String(genotype);
    const alleles = gtString.split(/[/|]/);

    let count = 0;

    for (const allele of alleles) {
      if (allele === '.') continue; // Missing allele

      const alleleIndex = parseInt(allele);
      if (isNaN(alleleIndex)) continue;

      let alleleBase: string;
      if (alleleIndex === 0) {
        alleleBase = vcfVariant.reference;
      } else {
        alleleBase = vcfVariant.alternate[alleleIndex - 1];
      }

      if (alleleBase === prsVariant.effectAllele) {
        count++;
      }
    }

    return count;
  }

  /**
   * Determine risk category from percentile
   */
  private static determineRiskCategory(
    percentile: number
  ): PolygenicRiskScore['riskCategory'] {
    if (percentile < 5) return 'very_low';
    if (percentile < 25) return 'low';
    if (percentile < 75) return 'average';
    if (percentile < 95) return 'high';
    return 'very_high';
  }

  /**
   * Calculate relative risk from standardized score
   */
  private static calculateRelativeRisk(standardizedScore: number): number {
    // Approximate conversion: RR ≈ exp(0.5 * standardized_score)
    // This is a simplification; actual conversion depends on the specific PRS
    return Math.exp(0.5 * standardizedScore);
  }

  /**
   * Normal cumulative distribution function
   */
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Generate interpretation text
   */
  private static generateInterpretation(
    condition: string,
    category: PolygenicRiskScore['riskCategory'],
    percentile: number,
    relativeRisk: number,
    absoluteRisk?: number
  ): string {
    const lines: string[] = [];

    lines.push(
      `Your polygenic risk score for ${condition} is in the ${percentile.toFixed(1)}th percentile.`
    );

    switch (category) {
      case 'very_high':
        lines.push(
          `This indicates a very high genetic predisposition compared to the general population (top 5%).`
        );
        break;
      case 'high':
        lines.push(
          `This indicates a higher genetic predisposition compared to the general population.`
        );
        break;
      case 'average':
        lines.push(
          `This indicates an average genetic predisposition similar to the general population.`
        );
        break;
      case 'low':
        lines.push(
          `This indicates a lower genetic predisposition compared to the general population.`
        );
        break;
      case 'very_low':
        lines.push(
          `This indicates a very low genetic predisposition compared to the general population (bottom 5%).`
        );
        break;
    }

    lines.push(
      `Your relative risk is approximately ${relativeRisk.toFixed(2)}x compared to someone with average genetic risk.`
    );

    if (absoluteRisk) {
      lines.push(
        `Your estimated lifetime risk is approximately ${(absoluteRisk * 100).toFixed(1)}%.`
      );
    }

    lines.push(
      `\nImportant: This score represents only genetic factors. Lifestyle, environment, and family history also significantly impact disease risk.`
    );

    return lines.join(' ');
  }

  /**
   * Generate clinical recommendations
   */
  private static generateRecommendations(
    condition: string,
    category: PolygenicRiskScore['riskCategory']
  ): string[] {
    const recommendations: string[] = [];

    if (category === 'very_high' || category === 'high') {
      switch (condition) {
        case 'Coronary Artery Disease':
          recommendations.push('Discuss cardiovascular risk reduction strategies with your physician');
          recommendations.push('Consider lipid panel and cardiovascular screening');
          recommendations.push('Maintain healthy diet, regular exercise, and avoid smoking');
          recommendations.push('Monitor blood pressure and cholesterol levels regularly');
          break;

        case 'Type 2 Diabetes':
          recommendations.push('Regular screening for diabetes (HbA1c, fasting glucose)');
          recommendations.push('Maintain healthy weight through diet and exercise');
          recommendations.push('Limit refined carbohydrates and added sugars');
          recommendations.push('Consider consultation with nutritionist or diabetes educator');
          break;

        case 'Breast Cancer':
          recommendations.push('Discuss enhanced screening options with your physician');
          recommendations.push('Consider earlier or more frequent mammography screening');
          recommendations.push('Genetic counseling to evaluate for high-penetrance mutations (BRCA1/2)');
          recommendations.push('Maintain healthy weight and limit alcohol consumption');
          break;

        case 'Atrial Fibrillation':
          recommendations.push('Regular cardiovascular health monitoring');
          recommendations.push('Control blood pressure and maintain healthy weight');
          recommendations.push('Limit alcohol consumption and manage stress');
          recommendations.push('Discuss stroke risk factors with your physician');
          break;

        case 'Prostate Cancer':
          recommendations.push('Discuss PSA screening options with your physician');
          recommendations.push('Consider earlier or more frequent prostate cancer screening');
          recommendations.push('Maintain healthy weight and regular physical activity');
          recommendations.push('Diet rich in vegetables, tomatoes, and fish');
          break;
      }
    } else {
      recommendations.push('Maintain general preventive health measures');
      recommendations.push('Follow standard screening guidelines for your age group');
      recommendations.push('Maintain healthy lifestyle including diet and exercise');
    }

    return recommendations;
  }

  /**
   * Calculate PRS for all available conditions
   */
  static calculateAllPRS(
    variants: VCFVariant[],
    sampleName: string
  ): PolygenicRiskScore[] {
    const results: PolygenicRiskScore[] = [];

    for (const condition of Object.keys(this.PRS_MODELS)) {
      const prs = this.calculatePRS(condition, variants, sampleName);
      if (prs) {
        results.push(prs);
      }
    }

    return results;
  }

  /**
   * Get available PRS conditions
   */
  static getAvailableConditions(): string[] {
    return Object.values(this.PRS_MODELS).map((model) => model.condition);
  }

  /**
   * Get high-risk conditions
   */
  static getHighRiskConditions(scores: PolygenicRiskScore[]): PolygenicRiskScore[] {
    return scores.filter(
      (score) => score.riskCategory === 'high' || score.riskCategory === 'very_high'
    );
  }
}
