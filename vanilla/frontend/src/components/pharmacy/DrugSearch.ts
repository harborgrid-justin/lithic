/**
 * DrugSearch.ts
 * Drug search component with NDC code lookup
 */

import pharmacyService, {
  type Medication,
} from "../../services/PharmacyService";

export class DrugSearch {
  private container: HTMLElement;
  private onSelect?: (medication: Medication) => void;

  constructor(
    container: HTMLElement,
    onSelect?: (medication: Medication) => void,
  ) {
    this.container = container;
    this.onSelect = onSelect;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="drug-search">
        <input type="search" class="search-input" placeholder="Search by drug name, NDC code..." />
        <div class="search-results"></div>
      </div>
      <style>
        .drug-search { position: relative; }
        .search-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
        .search-results { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 6px; margin-top: 4px; max-height: 300px; overflow-y: auto; display: none; }
        .search-result-item { padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
        .search-result-item:hover { background: #f8f9fa; }
      </style>
    `;

    const input = this.container.querySelector(
      ".search-input",
    ) as HTMLInputElement;
    const results = this.container.querySelector(
      ".search-results",
    ) as HTMLElement;

    input.addEventListener("input", async (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (query.length < 2) {
        results.style.display = "none";
        return;
      }

      const medications = await pharmacyService.searchMedications(query);
      results.innerHTML = medications
        .map(
          (med) => `
        <div class="search-result-item" data-id="${med.id}">
          <div><strong>${med.name}</strong></div>
          <div style="font-size: 12px; color: #666;">NDC: ${med.ndcCode} | ${med.strength}</div>
        </div>
      `,
        )
        .join("");
      results.style.display = "block";

      results.querySelectorAll(".search-result-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = (item as HTMLElement).dataset.id!;
          const med = medications.find((m) => m.id === id);
          if (med && this.onSelect) {
            this.onSelect(med);
            results.style.display = "none";
            input.value = med.name;
          }
        });
      });
    });
  }
}
