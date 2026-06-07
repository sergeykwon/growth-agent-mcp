import { competitorAnalysisPrompt } from "./competitorAnalysis.js";
import { pmfValidationPrompt } from "./pmfValidation.js";
import { growthLoopDesignPrompt } from "./growthLoopDesign.js";
import { growthAuditPrompt } from "./growthAudit.js";

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: { name: string; description: string; required: boolean }[];
  render(args: Record<string, string | undefined>): string;
}

export const PROMPTS: PromptDefinition[] = [
  growthAuditPrompt,
  competitorAnalysisPrompt,
  pmfValidationPrompt,
  growthLoopDesignPrompt,
];

export function findPrompt(name: string): PromptDefinition | undefined {
  return PROMPTS.find((p) => p.name === name);
}
