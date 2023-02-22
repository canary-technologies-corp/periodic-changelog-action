import * as core from "@actions/core";
import { readChangelog } from "./changelog";
import { asRelative, findChangelogs } from "./changelogs";
import { getCommitsForChangelog } from "./commits";
import { createChangelogPullRequest } from "./pullRequests";

async function run(): Promise<void> {
  try {
    updateChangelogs();
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

function getLastWeekDate() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return weekAgo;
}

run();
