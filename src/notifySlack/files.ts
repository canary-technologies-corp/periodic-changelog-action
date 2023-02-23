import * as core from "@actions/core";
import * as github from "@actions/github";
import { basename, join } from "path";

export async function getChangedChangelogFilenames({
  headSha,
  baseSha,
}: {
  headSha: string;
  baseSha: string;
}): Promise<string[]> {
  const octokit = github.getOctokit(core.getInput("github_token"));

  const response = await octokit.rest.repos.compareCommits({
    ...github.context.repo,
    base: baseSha,
    head: headSha,
  });

  if (response.status !== 200) {
    throw new Error(
      `The GitHub API for comparing the base and head commits returned ${response.status}, expected 200.`,
    );
  }

  return (response.data.files || [])
    .filter(file => {
      return (
        ["added", "modified", "copied", "changed"].includes(file.status) &&
        basename(file.filename) == "CHANGELOG.md"
      );
    })
    .map(file => join(process.cwd(), file.filename));
}
