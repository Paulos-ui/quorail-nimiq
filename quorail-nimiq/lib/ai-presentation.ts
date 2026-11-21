/** Convert model formatting artifacts into safe, readable plain-language paragraphs. */
export function cleanAssistantAnswer(value: string): string[] {
  const normalized = value
    .replace(/\\(["'])/g, '$1')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\r\n?/g, '\n')
    .trim();
  return normalized.split(/\n\s*\n|\n(?=• )/).map(s => s.trim()).filter(Boolean).slice(0, 20);
}
