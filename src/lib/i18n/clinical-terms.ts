/**
 * Clinical Terminology Mapping
 * Enterprise Healthcare Platform - Lithic
 *
 * Maps standard medical terminology codes to localized display strings
 * Supports: ICD-10, SNOMED CT, LOINC, RxNorm, CPT, HCPCS
 */

import type {
  SupportedLocale,
  ClinicalTerm,
  ClinicalTerminologyMapping,
} from '@/types/i18n';

/**
 * Clinical Terminology Manager
 */
export class ClinicalTerminologyManager {
  private mappings: Map<string, ClinicalTerminologyMapping>;
  private locale: SupportedLocale;
  private cache: Map<string, ClinicalTerm>;

  constructor(locale: SupportedLocale = 'en') {
    this.mappings = new Map();
    this.locale = locale;
    this.cache = new Map();
    this.loadDefaultMappings();
  }

  /**
   * Load default clinical terminology mappings
   */
  private loadDefaultMappings(): void {
    // Common ICD-10 codes
    this.addMapping({
      standardCode: 'E11',
      standardSystem: 'ICD-10',
      localizations: {
        en: { display: 'Type 2 Diabetes Mellitus', synonyms: ['T2DM', 'Type 2 Diabetes'] },
        es: { display: 'Diabetes Mellitus Tipo 2', synonyms: ['DMT2', 'Diabetes Tipo 2'] },
        fr: { display: 'Diabète de Type 2', synonyms: ['DT2'] },
        zh: { display: '2型糖尿病', synonyms: ['糖尿病2型'] },
        ar: { display: 'داء السكري من النوع 2', synonyms: ['السكري النوع الثاني'] },
        de: { display: 'Diabetes mellitus Typ 2', synonyms: ['Typ-2-Diabetes'] },
        ja: { display: '2型糖尿病', synonyms: ['糖尿病2型'] },
        ko: { display: '제2형 당뇨병', synonyms: ['2형 당뇨'] },
        pt: { display: 'Diabetes Mellitus Tipo 2', synonyms: ['DM2'] },
        ru: { display: 'Сахарный диабет 2 типа', synonyms: ['СД2'] },
      },
    });

    this.addMapping({
      standardCode: 'I10',
      standardSystem: 'ICD-10',
      localizations: {
        en: { display: 'Essential Hypertension', synonyms: ['High Blood Pressure', 'HTN'] },
        es: { display: 'Hipertensión Esencial', synonyms: ['Presión Alta', 'HTA'] },
        fr: { display: 'Hypertension Essentielle', synonyms: ['HTA'] },
        zh: { display: '原发性高血压', synonyms: ['高血压'] },
        ar: { display: 'ارتفاع ضغط الدم الأساسي', synonyms: ['ضغط الدم المرتفع'] },
        de: { display: 'Essentielle Hypertonie', synonyms: ['Bluthochdruck'] },
        ja: { display: '本態性高血圧症', synonyms: ['高血圧'] },
        ko: { display: '본태성 고혈압', synonyms: ['고혈압'] },
        pt: { display: 'Hipertensão Essencial', synonyms: ['Pressão Alta'] },
        ru: { display: 'Эссенциальная гипертензия', synonyms: ['Гипертония'] },
      },
    });

    this.addMapping({
      standardCode: 'J06.9',
      standardSystem: 'ICD-10',
      localizations: {
        en: { display: 'Acute Upper Respiratory Infection', synonyms: ['URI', 'Cold'] },
        es: { display: 'Infección Respiratoria Aguda Superior', synonyms: ['IRA', 'Resfriado'] },
        fr: { display: 'Infection Respiratoire Haute Aiguë', synonyms: ['Rhume'] },
        zh: { display: '急性上呼吸道感染', synonyms: ['感冒'] },
        ar: { display: 'عدوى الجهاز التنفسي العلوي الحادة', synonyms: ['الزكام'] },
        de: { display: 'Akute Infektion der oberen Atemwege', synonyms: ['Erkältung'] },
        ja: { display: '急性上気道感染症', synonyms: ['風邪'] },
        ko: { display: '급성 상기도 감염', synonyms: ['감기'] },
        pt: { display: 'Infecção Respiratória Aguda Superior', synonyms: ['Resfriado'] },
        ru: { display: 'Острая инфекция верхних дыхательных путей', synonyms: ['Простуда'] },
      },
    });

    // Common LOINC codes
    this.addMapping({
      standardCode: '2339-0',
      standardSystem: 'LOINC',
      localizations: {
        en: { display: 'Glucose [Mass/volume] in Blood', synonyms: ['Blood Glucose', 'Blood Sugar'] },
        es: { display: 'Glucosa [Masa/volumen] en Sangre', synonyms: ['Glucosa en Sangre'] },
        fr: { display: 'Glucose [Masse/volume] dans le Sang', synonyms: ['Glycémie'] },
        zh: { display: '血糖 [质量/体积]', synonyms: ['血糖浓度'] },
        ar: { display: 'الجلوكوز [الكتلة/الحجم] في الدم', synonyms: ['سكر الدم'] },
        de: { display: 'Glukose [Masse/Volumen] im Blut', synonyms: ['Blutzucker'] },
        ja: { display: '血中グルコース [質量/体積]', synonyms: ['血糖値'] },
        ko: { display: '혈당 [질량/부피]', synonyms: ['혈당 수치'] },
        pt: { display: 'Glicose [Massa/volume] no Sangue', synonyms: ['Glicemia'] },
        ru: { display: 'Глюкоза [Масса/объем] в Крови', synonyms: ['Сахар крови'] },
      },
    });

    this.addMapping({
      standardCode: '8480-6',
      standardSystem: 'LOINC',
      localizations: {
        en: { display: 'Systolic Blood Pressure', synonyms: ['SBP'] },
        es: { display: 'Presión Arterial Sistólica', synonyms: ['PAS'] },
        fr: { display: 'Pression Artérielle Systolique', synonyms: ['PAS'] },
        zh: { display: '收缩压', synonyms: ['高压'] },
        ar: { display: 'ضغط الدم الانقباضي', synonyms: ['الضغط الانقباضي'] },
        de: { display: 'Systolischer Blutdruck', synonyms: ['RRsys'] },
        ja: { display: '収縮期血圧', synonyms: ['最高血圧'] },
        ko: { display: '수축기 혈압', synonyms: ['최고 혈압'] },
        pt: { display: 'Pressão Arterial Sistólica', synonyms: ['PAS'] },
        ru: { display: 'Систолическое артериальное давление', synonyms: ['САД'] },
      },
    });

    // Common RxNorm codes (medications)
    this.addMapping({
      standardCode: '197361',
      standardSystem: 'RxNorm',
      localizations: {
        en: { display: 'Metformin', synonyms: ['Glucophage'] },
        es: { display: 'Metformina', synonyms: ['Glucophage'] },
        fr: { display: 'Metformine', synonyms: ['Glucophage'] },
        zh: { display: '二甲双胍', synonyms: ['格华止'] },
        ar: { display: 'ميتفورمين', synonyms: ['جلوكوفاج'] },
        de: { display: 'Metformin', synonyms: ['Glucophage'] },
        ja: { display: 'メトホルミン', synonyms: ['グルコファージ'] },
        ko: { display: '메트포르민', synonyms: ['글루코파지'] },
        pt: { display: 'Metformina', synonyms: ['Glucophage'] },
        ru: { display: 'Метформин', synonyms: ['Глюкофаж'] },
      },
    });

    this.addMapping({
      standardCode: '153666',
      standardSystem: 'RxNorm',
      localizations: {
        en: { display: 'Lisinopril', synonyms: ['Zestril', 'Prinivil'] },
        es: { display: 'Lisinopril', synonyms: ['Zestril', 'Prinivil'] },
        fr: { display: 'Lisinopril', synonyms: ['Zestril'] },
        zh: { display: '赖诺普利', synonyms: ['捷赐瑞'] },
        ar: { display: 'ليسينوبريل', synonyms: ['زيستريل'] },
        de: { display: 'Lisinopril', synonyms: ['Zestril'] },
        ja: { display: 'リシノプリル', synonyms: ['ゼストリル'] },
        ko: { display: '리시노프릴', synonyms: ['제스트릴'] },
        pt: { display: 'Lisinopril', synonyms: ['Zestril'] },
        ru: { display: 'Лизиноприл', synonyms: ['Зестрил'] },
      },
    });
  }

  /**
   * Add a terminology mapping
   */
  addMapping(mapping: ClinicalTerminologyMapping): void {
    const key = `${mapping.standardSystem}:${mapping.standardCode}`;
    this.mappings.set(key, mapping);
    this.cache.clear(); // Clear cache when mappings change
  }

  /**
   * Get localized clinical term
   */
  getTerm(
    code: string,
    system: string,
    locale?: SupportedLocale,
    includeContext?: boolean
  ): ClinicalTerm | null {
    const targetLocale = locale || this.locale;
    const key = `${system}:${code}`;
    const cacheKey = `${key}:${targetLocale}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Get mapping
    const mapping = this.mappings.get(key);
    if (!mapping) {
      return null;
    }

    // Get localization
    const localization = mapping.localizations[targetLocale];
    if (!localization) {
      // Try fallback to English
      const fallback = mapping.localizations.en;
      if (!fallback) return null;

      const term: ClinicalTerm = {
        code,
        system: system as ClinicalTerm['system'],
        display: fallback.display,
        synonyms: fallback.synonyms,
        locale: 'en',
      };
      return term;
    }

    const term: ClinicalTerm = {
      code,
      system: system as ClinicalTerm['system'],
      display: localization.display,
      synonyms: localization.synonyms,
      locale: targetLocale,
      context: includeContext ? localization.notes : undefined,
    };

    // Cache the result
    this.cache.set(cacheKey, term);

    return term;
  }

  /**
   * Search terms by display name
   */
  searchTerms(
    query: string,
    system?: string,
    locale?: SupportedLocale,
    limit: number = 10
  ): ClinicalTerm[] {
    const targetLocale = locale || this.locale;
    const results: ClinicalTerm[] = [];
    const queryLower = query.toLowerCase();

    for (const [key, mapping] of this.mappings) {
      if (system && !key.startsWith(`${system}:`)) continue;

      const localization = mapping.localizations[targetLocale];
      if (!localization) continue;

      // Search in display and synonyms
      const matches =
        localization.display.toLowerCase().includes(queryLower) ||
        localization.synonyms?.some((syn) =>
          syn.toLowerCase().includes(queryLower)
        );

      if (matches) {
        const [termSystem, termCode] = key.split(':');
        results.push({
          code: termCode!,
          system: termSystem as ClinicalTerm['system'],
          display: localization.display,
          synonyms: localization.synonyms,
          locale: targetLocale,
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get all terms for a system
   */
  getTermsBySystem(
    system: string,
    locale?: SupportedLocale
  ): ClinicalTerm[] {
    const targetLocale = locale || this.locale;
    const results: ClinicalTerm[] = [];

    for (const [key, mapping] of this.mappings) {
      if (!key.startsWith(`${system}:`)) continue;

      const localization = mapping.localizations[targetLocale];
      if (!localization) continue;

      const [, termCode] = key.split(':');
      results.push({
        code: termCode!,
        system: system as ClinicalTerm['system'],
        display: localization.display,
        synonyms: localization.synonyms,
        locale: targetLocale,
      });
    }

    return results;
  }

  /**
   * Bulk load terminology mappings
   */
  bulkLoadMappings(mappings: ClinicalTerminologyMapping[]): void {
    for (const mapping of mappings) {
      this.addMapping(mapping);
    }
  }

  /**
   * Export mappings
   */
  exportMappings(): ClinicalTerminologyMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Clear all mappings
   */
  clearMappings(): void {
    this.mappings.clear();
    this.cache.clear();
  }

  /**
   * Set locale
   */
  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    this.cache.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalMappings: number;
    systemCounts: Record<string, number>;
    localeCoverage: Record<SupportedLocale, number>;
  } {
    const systemCounts: Record<string, number> = {};
    const localeCounts: Record<string, number> = {};

    for (const [key, mapping] of this.mappings) {
      const system = key.split(':')[0]!;
      systemCounts[system] = (systemCounts[system] || 0) + 1;

      for (const locale of Object.keys(mapping.localizations)) {
        localeCounts[locale] = (localeCounts[locale] || 0) + 1;
      }
    }

    const totalMappings = this.mappings.size;
    const localeCoverage: Record<string, number> = {};
    for (const [locale, count] of Object.entries(localeCounts)) {
      localeCoverage[locale] = totalMappings > 0 ? (count / totalMappings) * 100 : 0;
    }

    return {
      totalMappings,
      systemCounts,
      localeCoverage: localeCoverage as Record<SupportedLocale, number>,
    };
  }
}

/**
 * Common clinical term categories
 */
export const clinicalTermCategories = {
  diagnoses: 'ICD-10',
  procedures: 'CPT',
  medications: 'RxNorm',
  labTests: 'LOINC',
  symptoms: 'SNOMED',
  billing: 'HCPCS',
};

/**
 * Helper to format clinical term for display
 */
export const formatClinicalTerm = (
  term: ClinicalTerm,
  options: {
    includeCode?: boolean;
    includeSystem?: boolean;
    includeSynonyms?: boolean;
  } = {}
): string => {
  const { includeCode = false, includeSystem = false, includeSynonyms = false } = options;

  let result = term.display;

  if (includeCode) {
    result += ` (${term.code})`;
  }

  if (includeSystem) {
    result += ` [${term.system}]`;
  }

  if (includeSynonyms && term.synonyms && term.synonyms.length > 0) {
    result += ` - ${term.synonyms.join(', ')}`;
  }

  return result;
};

// Singleton instance
let clinicalTerminologyInstance: ClinicalTerminologyManager | null = null;

/**
 * Get clinical terminology manager singleton
 */
export const getClinicalTerminology = (
  locale?: SupportedLocale
): ClinicalTerminologyManager => {
  if (!clinicalTerminologyInstance) {
    clinicalTerminologyInstance = new ClinicalTerminologyManager(locale);
  } else if (locale) {
    clinicalTerminologyInstance.setLocale(locale);
  }
  return clinicalTerminologyInstance;
};

export default ClinicalTerminologyManager;
