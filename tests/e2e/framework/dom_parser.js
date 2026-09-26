/**
 * Axiocruit E2E Test Suite - Opaque-Box DOM & AST Inspector
 * Inspects React/JSX component tree, DOM structures, CSS classes, and attributes
 */

import fs from 'fs';
import path from 'path';

export class SourceInspector {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.cache = new Map();
  }

  readFile(relativePath) {
    if (this.cache.has(relativePath)) {
      return this.cache.get(relativePath);
    }
    const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(this.rootPath, relativePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    this.cache.set(relativePath, content);
    return content;
  }

  findMatchingLines(relativePath, pattern) {
    const content = this.readFile(relativePath);
    if (!content) return [];
    const lines = content.split('\n');
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    const matches = [];
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        matches.push({ lineIndex: index + 1, content: line.trim() });
      }
    });
    return matches;
  }

  hasText(relativePath, text) {
    const content = this.readFile(relativePath);
    if (!content) return false;
    return content.includes(text);
  }

  hasPattern(relativePath, pattern) {
    const content = this.readFile(relativePath);
    if (!content) return false;
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return regex.test(content);
  }

  extractJSXElements(relativePath, tagName) {
    const content = this.readFile(relativePath);
    if (!content) return [];
    // Match JSX tags: <Tag ... > ... </Tag> or self-closing <Tag ... />
    const tagRegex = new RegExp(`<${tagName}\\b([^>]*)(?:>(.*?)</${tagName}>|/>)`, 'gs');
    const elements = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      elements.push({
        raw: match[0],
        attributes: match[1] ? match[1].trim() : '',
        body: match[2] ? match[2].trim() : '',
        isSelfClosing: match[0].endsWith('/>')
      });
    }
    return elements;
  }

  extractPillButtons(relativePath) {
    const content = this.readFile(relativePath);
    if (!content) return [];
    // Look for button elements with rounded-full
    const buttonRegex = /<button\b([^>]*)>(.*?)<\/button>/gs;
    const buttons = [];
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
      const attrs = match[1];
      const body = match[2];
      if (attrs.includes('rounded-full') || attrs.includes('rounded-2xl') || attrs.includes('rounded-3xl')) {
        buttons.push({
          attrs,
          body,
          isWhite: attrs.includes('bg-white'),
          isBlack: attrs.includes('bg-[#111111]') || attrs.includes('bg-black'),
          isLime: attrs.includes('#D4F882'),
          text: body.replace(/<[^>]+>/g, '').trim()
        });
      }
    }
    return buttons;
  }

  extractMetricCards(relativePath) {
    const content = this.readFile(relativePath);
    if (!content) return [];
    const cardRegex = /<MetricStatCard\b([^>]*)\/>/g;
    const cards = [];
    let match;
    while ((match = cardRegex.exec(content)) !== null) {
      const attrStr = match[1];
      const labelMatch = attrStr.match(/label="([^"]+)"/);
      const colorMatch = attrStr.match(/colorVariant="([^"]+)"/);
      const valueMatch = attrStr.match(/value=\{?([^"\s}]+)\}?/);
      cards.push({
        raw: match[0],
        label: labelMatch ? labelMatch[1] : null,
        colorVariant: colorMatch ? colorMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null
      });
    }
    return cards;
  }

  extractColorTokens(relativePath) {
    const content = this.readFile(relativePath);
    if (!content) return [];
    // Find all #RRGGBB hex colors
    const hexRegex = /#([0-9A-Fa-f]{6})\b/g;
    const colors = new Set();
    let match;
    while ((match = hexRegex.exec(content)) !== null) {
      colors.add(match[0].toUpperCase());
    }
    return Array.from(colors);
  }
}

export const defaultInspector = new SourceInspector();
