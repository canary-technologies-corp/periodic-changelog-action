import { readFile } from "fs/promises";

export interface Changelog {
  headerContent: string | null;
  bodyContent: string;
  footerContent: string | null;
  owner: string[];
  notify: string[];
  lastRan: Date | null;
}

export async function readChangelog(
  changelogFilename: string,
): Promise<Changelog> {
  const content = await readFile(changelogFilename);
  return parseChangelog(content.toString("utf8"));
}

export function parseChangelog(changelogString: string): Changelog {
  const { header, body, footer } = parseSections(changelogString);
  return {
    headerContent: header || null,
    bodyContent: body,
    footerContent: footer || null,
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
      body: result.slice(1, content.length - 1).join("---"),
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
