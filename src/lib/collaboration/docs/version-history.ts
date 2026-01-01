/**
 * Document Version History Manager
 * Handles version management, diff visualization, and rollback support
 */

import { DocumentChange } from "./collaborative-editor";
import { z } from "zod";

export const VersionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  version: z.number(),
  content: z.string(),
  changes: z.array(z.any()),
  createdBy: z.string(),
  createdByName: z.string(),
  createdAt: z.date(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isMajor: z.boolean().default(false),
  parentVersionId: z.string().optional(),
});

export type Version = z.infer<typeof VersionSchema>;

export interface DiffChunk {
  type: "ADDED" | "REMOVED" | "UNCHANGED" | "MODIFIED";
  content: string;
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface VersionComparison {
  oldVersion: Version;
  newVersion: Version;
  diff: DiffChunk[];
  summary: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export class VersionHistoryManager {
  private versions: Map<string, Version> = new Map();
  private versionsByDocument: Map<string, string[]> = new Map();

  /**
   * Create a new version
   */
  createVersion(
    documentId: string,
    content: string,
    changes: DocumentChange[],
    userId: string,
    userName: string,
    options: {
      description?: string;
      tags?: string[];
      isMajor?: boolean;
      parentVersionId?: string;
    } = {}
  ): Version {
    const versionNumber = this.getNextVersionNumber(documentId);

    const version: Version = {
      id: this.generateVersionId(),
      documentId,
      version: versionNumber,
      content,
      changes,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date(),
      description: options.description,
      tags: options.tags || [],
      isMajor: options.isMajor || false,
      parentVersionId: options.parentVersionId,
    };

    this.versions.set(version.id, version);

    // Add to document versions list
    const docVersions = this.versionsByDocument.get(documentId) || [];
    docVersions.push(version.id);
    this.versionsByDocument.set(documentId, docVersions);

    return version;
  }

  /**
   * Get version by ID
   */
  getVersion(versionId: string): Version | undefined {
    return this.versions.get(versionId);
  }

  /**
   * Get all versions for a document
   */
  getDocumentVersions(documentId: string): Version[] {
    const versionIds = this.versionsByDocument.get(documentId) || [];
    return versionIds
      .map((id) => this.versions.get(id))
      .filter((v): v is Version => v !== undefined)
      .sort((a, b) => b.version - a.version);
  }

  /**
   * Get latest version
   */
  getLatestVersion(documentId: string): Version | undefined {
    const versions = this.getDocumentVersions(documentId);
    return versions[0];
  }

  /**
   * Get major versions only
   */
  getMajorVersions(documentId: string): Version[] {
    return this.getDocumentVersions(documentId).filter((v) => v.isMajor);
  }

  /**
   * Get versions by tag
   */
  getVersionsByTag(documentId: string, tag: string): Version[] {
    return this.getDocumentVersions(documentId).filter((v) =>
      v.tags.includes(tag)
    );
  }

  /**
   * Compare two versions
   */
  compareVersions(
    oldVersionId: string,
    newVersionId: string
  ): VersionComparison | undefined {
    const oldVersion = this.versions.get(oldVersionId);
    const newVersion = this.versions.get(newVersionId);

    if (!oldVersion || !newVersion) return undefined;

    const diff = this.generateDiff(oldVersion.content, newVersion.content);
    const summary = this.calculateDiffSummary(diff);

    return {
      oldVersion,
      newVersion,
      diff,
      summary,
    };
  }

  /**
   * Generate diff between two text contents
   */
  private generateDiff(oldContent: string, newContent: string): DiffChunk[] {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    const diff: DiffChunk[] = [];

    // Simple line-by-line diff (in production, use a proper diff algorithm like Myers)
    const maxLines = Math.max(oldLines.length, newLines.length);
    let oldLineNum = 0;
    let newLineNum = 0;

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine) {
        diff.push({
          type: "UNCHANGED",
          content: oldLine || "",
          lineNumber: i,
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
      } else if (oldLine && !newLine) {
        diff.push({
          type: "REMOVED",
          content: oldLine,
          lineNumber: i,
          oldLineNumber: oldLineNum++,
        });
      } else if (!oldLine && newLine) {
        diff.push({
          type: "ADDED",
          content: newLine,
          lineNumber: i,
          newLineNumber: newLineNum++,
        });
      } else {
        // Both exist but different - mark as modified
        diff.push({
          type: "REMOVED",
          content: oldLine,
          lineNumber: i,
          oldLineNumber: oldLineNum++,
        });
        diff.push({
          type: "ADDED",
          content: newLine,
          lineNumber: i,
          newLineNumber: newLineNum++,
        });
      }
    }

    return diff;
  }

  /**
   * Calculate diff summary
   */
  private calculateDiffSummary(diff: DiffChunk[]): {
    additions: number;
    deletions: number;
    modifications: number;
  } {
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    for (let i = 0; i < diff.length; i++) {
      const chunk = diff[i];

      if (chunk.type === "ADDED") {
        additions++;
      } else if (chunk.type === "REMOVED") {
        deletions++;
      } else if (chunk.type === "MODIFIED") {
        modifications++;
      }
    }

    return { additions, deletions, modifications };
  }

  /**
   * Rollback to a specific version
   */
  rollbackToVersion(
    documentId: string,
    versionId: string,
    userId: string,
    userName: string
  ): Version | undefined {
    const targetVersion = this.versions.get(versionId);
    if (!targetVersion) return undefined;

    // Create a new version with the old content
    return this.createVersion(
      documentId,
      targetVersion.content,
      [],
      userId,
      userName,
      {
        description: `Rolled back to version ${targetVersion.version}`,
        tags: ["rollback"],
        isMajor: true,
        parentVersionId: versionId,
      }
    );
  }

  /**
   * Get version diff for display
   */
  getVersionDiff(versionId: string): DiffChunk[] | undefined {
    const version = this.versions.get(versionId);
    if (!version || !version.parentVersionId) return undefined;

    const parentVersion = this.versions.get(version.parentVersionId);
    if (!parentVersion) return undefined;

    return this.generateDiff(parentVersion.content, version.content);
  }

  /**
   * Tag a version
   */
  tagVersion(versionId: string, tag: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) return false;

    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
      this.versions.set(versionId, version);
    }

    return true;
  }

  /**
   * Remove tag from version
   */
  removeTag(versionId: string, tag: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) return false;

    version.tags = version.tags.filter((t) => t !== tag);
    this.versions.set(versionId, version);

    return true;
  }

  /**
   * Mark version as major
   */
  markAsMajor(versionId: string, description?: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) return false;

    version.isMajor = true;
    if (description) {
      version.description = description;
    }
    this.versions.set(versionId, version);

    return true;
  }

  /**
   * Get version statistics
   */
  getVersionStats(documentId: string): {
    totalVersions: number;
    majorVersions: number;
    contributors: number;
    oldestVersion?: Date;
    newestVersion?: Date;
    averageChangeSize: number;
  } {
    const versions = this.getDocumentVersions(documentId);

    if (versions.length === 0) {
      return {
        totalVersions: 0,
        majorVersions: 0,
        contributors: 0,
        averageChangeSize: 0,
      };
    }

    const contributors = new Set(versions.map((v) => v.createdBy));
    const majorVersions = versions.filter((v) => v.isMajor);
    const totalChanges = versions.reduce((sum, v) => sum + v.changes.length, 0);

    return {
      totalVersions: versions.length,
      majorVersions: majorVersions.length,
      contributors: contributors.size,
      oldestVersion: versions[versions.length - 1]?.createdAt,
      newestVersion: versions[0]?.createdAt,
      averageChangeSize: totalChanges / versions.length,
    };
  }

  /**
   * Get changes between versions
   */
  getChangesBetween(
    startVersionId: string,
    endVersionId: string
  ): DocumentChange[] {
    const startVersion = this.versions.get(startVersionId);
    const endVersion = this.versions.get(endVersionId);

    if (!startVersion || !endVersion) return [];

    const startNum = startVersion.version;
    const endNum = endVersion.version;
    const documentId = startVersion.documentId;

    const versions = this.getDocumentVersions(documentId).filter(
      (v) => v.version > startNum && v.version <= endNum
    );

    return versions.flatMap((v) => v.changes);
  }

  /**
   * Get version timeline
   */
  getTimeline(documentId: string): {
    date: Date;
    versions: Version[];
  }[] {
    const versions = this.getDocumentVersions(documentId);
    const timeline = new Map<string, Version[]>();

    versions.forEach((version) => {
      const dateKey = version.createdAt.toISOString().split("T")[0];
      const dayVersions = timeline.get(dateKey) || [];
      dayVersions.push(version);
      timeline.set(dateKey, dayVersions);
    });

    return Array.from(timeline.entries())
      .map(([date, versions]) => ({
        date: new Date(date),
        versions,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Export version as file
   */
  exportVersion(
    versionId: string,
    format: "text" | "html" | "json" = "text"
  ): string | undefined {
    const version = this.versions.get(versionId);
    if (!version) return undefined;

    switch (format) {
      case "text":
        return version.content;

      case "html":
        return `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Version ${version.version} - ${version.description || "Document"}</title>
              <meta charset="utf-8">
            </head>
            <body>
              <h1>Version ${version.version}</h1>
              <p><strong>Created:</strong> ${version.createdAt.toLocaleString()}</p>
              <p><strong>By:</strong> ${version.createdByName}</p>
              ${version.description ? `<p><strong>Description:</strong> ${version.description}</p>` : ""}
              <hr>
              <pre>${version.content}</pre>
            </body>
          </html>
        `;

      case "json":
        return JSON.stringify(version, null, 2);

      default:
        return version.content;
    }
  }

  /**
   * Prune old versions (keep only last N versions)
   */
  pruneVersions(documentId: string, keepCount: number): number {
    const versions = this.getDocumentVersions(documentId);

    if (versions.length <= keepCount) return 0;

    const toRemove = versions.slice(keepCount);
    let removed = 0;

    toRemove.forEach((version) => {
      if (!version.isMajor && !version.tags.includes("important")) {
        this.versions.delete(version.id);

        const docVersions = this.versionsByDocument.get(documentId) || [];
        this.versionsByDocument.set(
          documentId,
          docVersions.filter((id) => id !== version.id)
        );

        removed++;
      }
    });

    return removed;
  }

  /**
   * Get next version number
   */
  private getNextVersionNumber(documentId: string): number {
    const versions = this.getDocumentVersions(documentId);
    if (versions.length === 0) return 1;

    const maxVersion = Math.max(...versions.map((v) => v.version));
    return maxVersion + 1;
  }

  /**
   * Generate version ID
   */
  private generateVersionId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Clear all versions for a document
   */
  clearDocumentVersions(documentId: string): void {
    const versionIds = this.versionsByDocument.get(documentId) || [];

    versionIds.forEach((id) => {
      this.versions.delete(id);
    });

    this.versionsByDocument.delete(documentId);
  }
}

/**
 * Singleton instance
 */
export const versionHistoryManager = new VersionHistoryManager();
