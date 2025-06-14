export interface ExportData {
  version: string;
  exportDate: string;
  metadata: ExportMetadata;
  prompts: ExportPrompt[];
  tags: ExportTag[];
}

export interface ExportMetadata {
  appVersion: string;
  totalPrompts: number;
  totalTags: number;
  exportedBy: string;
}

export interface ExportPrompt {
  promptGroupId: string;
  title: string;
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
  versions: ExportPromptVersion[];
  tags: string[]; // tag IDs
}

export interface ExportPromptVersion {
  id: string;
  version: number;
  content: string;
  sourceUrl?: string;
  isLatest: boolean;
  dateCreated: string;
}

export interface ExportTag {
  id: string;
  name: string;
  color: string;
  dateCreated: string;
}

export interface ImportOptions {
  mode: 'merge' | 'overwrite' | 'skip';
  includeVersionHistory: boolean;
  includeTags: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedPrompts: number;
  importedTags: number;
  skippedPrompts: number;
  skippedTags: number;
  errors: string[];
} 