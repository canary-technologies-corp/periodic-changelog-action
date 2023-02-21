import * as exec from "@actions/exec";
import { toPlatformPath } from "@actions/core";
import { dirname } from "path";
import { asRelative } from "./changelogs";

export interface CommitLog {
  hash: string;
  title: string;
  tag: string | null;
}

export async function getCommitsForChangelog({
  changelogFilename,
  since,
}: {
  changelogFilename: string;
  since: Date;
}): Promise<CommitLog[]> {
  let output = "";
  let error = "";
  const relativeFilename = asRelative(changelogFilename);

  // TODO: Remove
  await exec.exec("git", ["--version"]);

  const commandOutput = await exec.exec(
    "git",
    [
      "log",
      "--oneline",
      `--since=${since.toISOString()}`,
      "--",
      toPlatformPath(dirname(relativeFilename)),
      `':!${toPlatformPath(relativeFilename)}'`,
    ],
    {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          error += data.toString();
        },
      },
    },
  );
  if (commandOutput != 0) {
    throw new Error(`Error in 'git' - ${error}`);
  }
  return output
    .split("\n")
    .filter(line => line.trim().length > 0)
    .map(line => {
      const result = line.match(/^([A-z0-9]+)\s(\(tag:\sv[0-9.]+\))?(.*)$/m);
      if (!result?.[1] || !result?.[3]) {
        throw Error(`Unparsable commit: ${line}`);
      }
      return {
        hash: result[1],
        title: result[3],
        tag: result[2]?.replace("(tag: ", "")?.replace(")", "") ?? null,
      };
    });
}
