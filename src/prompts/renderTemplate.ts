/**
 * Replace `{{key}}` placeholders in a template with values from `vars`.
 * Missing keys are left as-is so the user/agent can see they were not filled.
 */
export function renderPromptTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key];
    }
    return match;
  });
}
