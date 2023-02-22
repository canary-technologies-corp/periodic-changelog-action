import * as core from "@actions/core";
import { readChangelog } from "./changelog";
import { asRelative, findChangelogs } from "./changelogs";
import { getCommitsForChangelog } from "./commits";
import { createChangelogPullRequest } from "./pullRequests";
import * as github from "@actions/github";

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

  // TODO: Notify Slack.
}

function getLastWeekDate() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return weekAgo;
}

run();
