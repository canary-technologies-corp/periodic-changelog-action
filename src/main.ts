import * as core from "@actions/core";
import { readChangelog } from "./changelog";
import { findChangelogs } from "./updateChangelogs/changelogs";
import { getCommitsForChangelog } from "./updateChangelogs/commits";
import { createChangelogPullRequest } from "./updateChangelogs/changelogPullRequest";
import * as github from "@actions/github";
import { getChangedChangelogFilenames } from "./notifySlack/files";
import { sendSlackMessage } from "./notifySlack/slack";
import { asRelative } from "./utils";

enum Operation {
  UPDATE_CHANGELOGS = "update_changelogs",
  NOTIFY_SLACK = "notify_slack",
}

async function run(): Promise<void> {
  try {
    const operation = core.getInput("operation") as Operation;
    switch (operation) {
      case Operation.UPDATE_CHANGELOGS:
        await updateChangelogs();
        break;
      case Operation.NOTIFY_SLACK:
        await notifySlack();
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

async function updateChangelogs(): Promise<void> {
  core.info(`Finding changelogs...`);
  const changelogs = await findChangelogs();
  core.info(`Found changelogs:\n${changelogs.join("\n")}`);

  for (const changelog of changelogs) {
    core.startGroup(asRelative(changelog));
    try {
      await updateChangelog(changelog);
    } catch (error) {
      if (error instanceof Error) core.error(error.message);
    } finally {
      core.endGroup();
    }
  }
}

async function updateChangelog(changelogFilename: string): Promise<void> {
  core.info("Reading changelog...");
  const changelog = await readChangelog(changelogFilename);
  core.info("Parse changelog successfully.");

  const since = changelog.lastRan || getLastWeekDate();
  core.info(`Finding commits since ${since.toString()}...`);
  const commits = await getCommitsForChangelog({
    changelogFilename: changelogFilename,
    since,
  });

  if (!commits.length) {
    core.info("No commits... skipping changelog.");
    return;
  }
  core.info(`Found ${commits.length} commits. Creating PR...`);

  const { url } = await createChangelogPullRequest({
    changelogFilename,
    changelog,
    commits,
  });

  core.info(`Created PR: ${url}`);
}

async function notifySlack() {
  core.debug(JSON.stringify(github.context.payload.pull_request, undefined, 2));
  if (github.context.payload.pull_request?.state != "closed") {
    throw new Error("Can only run in the context of a pull request merge.");
  }
  const slackWebhook = core.getInput("slack_webhook");
  if (!slackWebhook) {
    throw new Error("Missing 'slack_webhook' input.");
  }

  const baseSha = github.context.payload.pull_request.base.sha as string;
  const headSha = github.context.payload.pull_request.head.sha as string;
  core.info(`Base commit: ${baseSha}`);
  core.info(`Head commit: ${headSha}`);

  const changelogFilenames = await getChangedChangelogFilenames({
    baseSha,
    headSha,
  });
  core.info(`Found changelogs:\n ${changelogFilenames.join("\n")}`);

  for (const changelogFilename of changelogFilenames) {
    core.startGroup(asRelative(changelogFilename));
    try {
      core.debug("Reading changelog...");
      const changelog = await readChangelog(changelogFilename);

      if (!changelog.changeSets.length) {
        throw new Error("Changelog did not have any changesets.");
      }

      core.debug("Sending Slack message...");
      await sendSlackMessage({
        changelog,
        slackWebhook,
        changelogFilename,
        pullRequestUrl: github.context.payload.pull_request._links.html.href,
      });
    } catch (error) {
      if (error instanceof Error) core.error(error.message);
    } finally {
      core.endGroup();
    }
  }
}

function getLastWeekDate() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return weekAgo;
}

run();
