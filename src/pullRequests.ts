import { Changelog } from "./changelog";
import { CommitLog } from "./commits";
import { writeFile } from "fs/promises";
import * as core from "@actions/core";
import * as github from "@actions/github";
import simpleGit, { SimpleGit } from "simple-git";
import { dirname, join } from "path";
import { asRelative } from "./changelogs";

export async function createChangelogPullRequest({
  changelogFilename,
  changelog,
  commits,
}: {
  changelogFilename: string;
  changelog: Changelog;
  commits: CommitLog[];
}): Promise<{ url: string }> {
  const git = await createGit();

  // Checkout a new branch.
  const baseBranch = core.getInput("base_branch") as string;
  const branchName = getBranchName(changelogFilename);
  core.debug(`Checking out new branch: ${branchName}`);
  await git.checkoutBranch(branchName, baseBranch, log);

  // Update and commit changes to changelog.
  core.debug("Updating changelog file...");
  await updateChangelogFile({ changelogFilename, changelog, commits });
  core.debug("Adding file...");
  await git.add(changelogFilename, log);
  core.debug("Commiting changed file...");
  await git.commit("Update Changelog.", undefined, log);

  // Push up new branch.
  core.debug("Pushing upstream...");
  await git.push("origin", branchName, { "--set-upstream": null }, log);

  // Create pull request with a label.
  const yearAndWeek = getYearAndWeekNumber(new Date());
  const folder = dirname(asRelative(changelogFilename));
  const octokit = github.getOctokit(core.getInput("github_token"));
  const { data: pull } = await octokit.rest.pulls.create({
    ...github.context.repo,
    base: baseBranch,
    head: branchName,
    title: `${yearAndWeek}: Changelog for \`/${folder}\``,
    body: `Please review and merge the changelog for \`/${folder}\`.`,
    maintainer_can_modify: true,
  });
  await octokit.rest.issues.addLabels({
    ...github.context.repo,
    issue_number: pull.number,
    labels: ["Changelog"],
  });

  // Add assignees (if any).
  if (changelog.notify.length) {
    core.debug(`Adding assignees: ${changelog.owner}`);
    await octokit.rest.issues.addAssignees({
      ...github.context.repo,
      issue_number: pull.number,
      assignees: changelog.notify,
    });
  } else {
    core.debug("No assignees found.");
  }

  // Assign reviewer (if any).
  if (changelog.owner.length) {
    core.debug(`Adding reviewers: ${changelog.owner}`);
    const result = await octokit.rest.pulls.requestReviewers({
      ...github.context.repo,
      pull_number: pull.number,
      reviewers: changelog.owner,
    });
    core.debug(JSON.stringify(result, null, 2));
  } else {
    core.debug("No reviewers found.");
  }

  return { url: pull._links.html.href };
}

export async function updateChangelogFile({
  changelogFilename,
  changelog,
  commits,
}: {
  changelogFilename: string;
  changelog: Changelog;
  commits: CommitLog[];
}): Promise<void> {
  const now = new Date();
  const content = [
    changelog.headerContent,
    "\n---\n",
    `## ${getYearAndWeekNumber(now)}`,
    ...commits.map(commit => `* ${commit.titleMarkdown}`),
    "",
    changelog.bodyContent,
    "\n---\n",
    `Last ran: ${now.toISOString()}`,
  ];
  return writeFile(changelogFilename, content.join("\n"));
}

function getYearAndWeekNumber(date: Date): string {
  const weekNumber = getWeekNumber(date);
  return `${date.getFullYear()}.${weekNumber < 10 ? "0" : ""}${weekNumber}`;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(err: any | Error, data?: any) {
  if (data) core.info(JSON.stringify(data, null, 2));
  if (err) core.error(err);
}

function getBranchName(changelogFilename: string): string {
  const name = asRelative(dirname(changelogFilename))
    .replace("/", "-")
    .replace("\\", "-");
  const now = new Date();
  return `${now.getFullYear()}-${getWeekNumber(new Date())}-${name}`;
}

async function createGit(): Promise<SimpleGit> {
  const baseDir = join(process.cwd() || "");
  const git = simpleGit({ baseDir });
  await git
    .addConfig("user.name", "Github Bot", undefined, log)
    .addConfig("user.email", "<>", undefined, log)
    .addConfig("author.name", "Github Bot", undefined, log)
    .addConfig("author.email", "<>", undefined, log);
  return git;
}
