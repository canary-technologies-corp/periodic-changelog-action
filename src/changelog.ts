import { readFile } from "fs/promises";
import * as core from "@actions/core";

export interface Changelog {
  headerContent: string | null;
  bodyContent: string;
  footerContent: string | null;
  changeSets: ChangeSet[];
  owner: string[];
  notify: string[];
  lastRan: Date | null;
}

export interface ChangeSet {
  title: string;
  changes: string[];
}

export async function readChangelog(
  changelogFilename: string,
): Promise<Changelog> {
  core.debug(`Reading changelog: ${changelogFilename}`);
  const content = await readFile(changelogFilename, { encoding: "utf8" });
  return parseChangelog(content.toString());
}

export function parseChangelog(changelogString: string): Changelog {
  const { header, body, footer } = parseSections(changelogString);
  return {
    headerContent: header?.trim() || null,
    bodyContent: body.trim(),
    footerContent: footer?.trim() || null,
    changeSets: parseChangeSets(body.trim()),
    owner: header ? parseOwner(header) : [],
    notify: header ? parseNotify(header) : [],
    lastRan: footer ? parseLastRun(footer) : null,
  };
}

function parseSections(content: string): {
  header: string | null;
  body: string;
  footer: string | null;
} {
  const result = content.split("---");
  if (result.length >= 3) {
    return {
      header: result[0],
      body: result.slice(1, result.length - 1).join("\n---\n"),
      footer: result[result.length - 1],
    };
  }
  if (result.length == 2) {
    if (result[1].includes("Last ran:")) {
      return { header: null, body: result[0], footer: result[1] };
    }
    return {
      header: result[0],
      body: result[1],
      footer: null,
    };
  }
  return {
    header: null,
    body: content,
    footer: null,
  };
}

function parseOwner(headerContent: string): string[] {
  const result = headerContent.match(/Owner:\s*([A-z0-9\-_,\s]+)/);
  if (result?.[1]) {
    const separated = result?.[1].split(",");
    return separated.map(v => v.trim());
  }
  return [];
}

function parseNotify(headerContent: string): string[] {
  const result = headerContent.match(/Notify:\s*([A-z0-9\-_,\s]+)/);
  if (result?.[1]) {
    const separated = result?.[1].split(",");
    return separated.map(v => v.trim());
  }
  return [];
}

function parseLastRun(footerContent: string): Date | null {
  const result = footerContent.match(/Last ran:\s*([0-9TZ\-:.]*)/);
  if (result?.[1]) {
    const date = new Date(result[1]);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function parseChangeSets(body: string): ChangeSet[] {
  const sections: Array<{
    title: string;
    startIndex: number;
    raw: string;
  }> = [];

  const headingsRegex = /##\s*([A-z0-9.]*)\s*\n/gi;
  let match: RegExpExecArray | null;
  while ((match = headingsRegex.exec(body))) {
    sections.push({
      raw: match[0],
      title: match[1],
      startIndex: match.index,
    });
  }

  return sections.map((section, index) => {
    const start = section.startIndex + section.raw.length;
    const end = sections[index + 1]
      ? sections[index + 1].startIndex
      : undefined;
    const content = body.slice(start, end);
    return {
      title: section.title,
      changes: parseChanges(content),
    };
  });
}

function parseChanges(changesContent: string): string[] {
  return changesContent
    .split(/^\s*\*\s+/gm)
    .map(c => c.trim())
    .filter(c => c);
}
