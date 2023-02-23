import { Changelog } from "../changelog";
import * as core from "@actions/core";
import axios from "axios";
import { asRelative } from "../utils";
import { dirname } from "path";

export async function sendSlackMessage({
  slackWebhook,
  changelogFilename,
  changelog,
  pullRequestUrl,
}: {
  slackWebhook: string;
  changelogFilename: string;
  changelog: Changelog;
  pullRequestUrl: string;
}): Promise<void> {
  const response = await axios.post(slackWebhook, {
    username: "Changelog Bot",
    icon_emoji: ":newspaper:",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `/${dirname(asRelative(changelogFilename))}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "A new changelog entry has been added.",
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: changelog.changeSets[0].changes
            .map(c => {
              return `• ${convertMarkdownLinksToSlackStyle(c)}`;
            })
            .join("\n"),
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${pullRequestUrl}|View pull request>`,
        },
      },
    ],
  });
  core.info(JSON.stringify(response, undefined, 2));
  if (response.status != 200) {
    throw new Error("Failed to send Slack message");
  }
}

export function convertMarkdownLinksToSlackStyle(content: string): string {
  const matches: Array<{
    title: string;
    url: string;
    startIndex: number;
    raw: string;
  }> = [];

  const headingsRegex = /\[(.*?)\]\((.*?)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = headingsRegex.exec(content))) {
    matches.push({
      raw: match[0],
      title: match[1],
      url: match[2],
      startIndex: match.index,
    });
  }

  if (!matches.length) {
    return content;
  }

  // Reverse the array to apply the swaps in reverse and avoid having
  // to think about shifting indices.
  matches.reverse();

  let result = content;
  matches.forEach(m => {
    const before = result.slice(0, m.startIndex);
    const after = result.slice(m.startIndex + m.raw.length);
    result = `${before}<${m.url}|${m.title}>${after}`;
  });

  return result;
}
