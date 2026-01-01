/**
 * Reference Ranges Component
 * Display and manage reference ranges for lab tests
 */

export class ReferenceRanges {
  private container: HTMLElement;
  private ranges: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setRanges(ranges: any[]): void {
    this.ranges = ranges;
    this.render();
  }

  private render(): void {
    if (this.ranges.length === 0) {
      this.container.innerHTML = '<p>No reference ranges available</p>';
      return;
    }

    const groupedRanges = this.groupRangesByTest();

    const html = `
      <div class="reference-ranges">
        <div class="ranges-filter">
          <input type="text" id="rangeSearch" placeholder="Search tests...">
          <select id="ageGroupFilter">
            <option value="">All Age Groups</option>
            <option value="adult">Adult</option>
            <option value="pediatric">Pediatric</option>
            <option value="infant">Infant</option>
          </select>
          <select id="genderFilter">
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div class="ranges-list">
          ${Object.entries(groupedRanges).map(([testName, ranges]) =>
            this.renderTestRanges(testName, ranges as any[])
          ).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private groupRangesByTest(): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    this.ranges.forEach(range => {
      if (!grouped[range.testName]) {
        grouped[range.testName] = [];
      }
      grouped[range.testName].push(range);
    });

    return grouped;
  }

  private renderTestRanges(testName: string, ranges: any[]): string {
    return `
      <div class="test-ranges" data-test-name="${testName}">
        <h4>${testName} (${ranges[0].loincCode})</h4>
        <table class="ranges-table">
          <thead>
            <tr>
              <th>Age Group</th>
              <th>Gender</th>
              <th>Normal Range</th>
              <th>Unit</th>
              <th>Critical Low</th>
              <th>Critical High</th>
            </tr>
          </thead>
          <tbody>
            ${ranges.map(range => this.renderRangeRow(range)).join('')}
          </tbody>
        </table>
        ${ranges[0].description ? `<p class="range-description">${ranges[0].description}</p>` : ''}
      </div>
    `;
  }

  private renderRangeRow(range: any): string {
    const normalRange = this.formatRange(range.minValue, range.maxValue);

    return `
      <tr data-age-group="${range.ageGroup}" data-gender="${range.gender}">
        <td>${this.formatAgeGroup(range.ageGroup)}</td>
        <td>${this.formatGender(range.gender)}</td>
        <td>${normalRange}</td>
        <td>${range.unit}</td>
        <td>${range.criticalLow !== undefined ? range.criticalLow : '-'}</td>
        <td>${range.criticalHigh !== undefined ? range.criticalHigh : '-'}</td>
      </tr>
    `;
  }

  private formatRange(min?: number, max?: number): string {
    if (min !== undefined && max !== undefined) {
      return `${min} - ${max}`;
    }
    if (max !== undefined) {
      return `< ${max}`;
    }
    if (min !== undefined) {
      return `> ${min}`;
    }
    return '-';
  }

  private formatAgeGroup(ageGroup: string): string {
    return ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1);
  }

  private formatGender(gender: string): string {
    if (gender === 'all') return 'All';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  }

  private attachEventListeners(): void {
    const searchInput = this.container.querySelector('#rangeSearch') as HTMLInputElement;
    const ageGroupFilter = this.container.querySelector('#ageGroupFilter') as HTMLSelectElement;
    const genderFilter = this.container.querySelector('#genderFilter') as HTMLSelectElement;

    if (searchInput) {
      searchInput.addEventListener('input', () => this.applyFilters());
    }

    if (ageGroupFilter) {
      ageGroupFilter.addEventListener('change', () => this.applyFilters());
    }

    if (genderFilter) {
      genderFilter.addEventListener('change', () => this.applyFilters());
    }
  }

  private applyFilters(): void {
    const searchInput = this.container.querySelector('#rangeSearch') as HTMLInputElement;
    const ageGroupFilter = this.container.querySelector('#ageGroupFilter') as HTMLSelectElement;
    const genderFilter = this.container.querySelector('#genderFilter') as HTMLSelectElement;

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const ageGroup = ageGroupFilter?.value || '';
    const gender = genderFilter?.value || '';

    const testRanges = this.container.querySelectorAll('.test-ranges');

    testRanges.forEach(testRange => {
      const testName = (testRange as HTMLElement).dataset.testName?.toLowerCase() || '';
      const matchesSearch = !searchTerm || testName.includes(searchTerm);

      if (!matchesSearch) {
        (testRange as HTMLElement).style.display = 'none';
        return;
      }

      (testRange as HTMLElement).style.display = 'block';

      // Filter rows within the test
      const rows = testRange.querySelectorAll('tbody tr');
      let visibleRows = 0;

      rows.forEach(row => {
        const rowAgeGroup = (row as HTMLElement).dataset.ageGroup || '';
        const rowGender = (row as HTMLElement).dataset.gender || '';

        const matchesAgeGroup = !ageGroup || rowAgeGroup === ageGroup || rowAgeGroup === 'all';
        const matchesGender = !gender || rowGender === gender || rowGender === 'all';

        if (matchesAgeGroup && matchesGender) {
          (row as HTMLElement).style.display = '';
          visibleRows++;
        } else {
          (row as HTMLElement).style.display = 'none';
        }
      });

      // Hide test if no rows visible
      if (visibleRows === 0) {
        (testRange as HTMLElement).style.display = 'none';
      }
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
