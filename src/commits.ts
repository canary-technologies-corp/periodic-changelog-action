import exec from "@actions/exec";
import { toPlatformPath } from "@actions/core";
import path from "path";

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
  const error = "";
  const commandOutput = await exec.exec(
    "git",
    [
      "log",
      "--oneline",
      `--since=${since.toISOString()}`,
      "--",
      toPlatformPath(path.basename(changelogFilename)),
      `':!${toPlatformPath(changelogFilename)}'`,
    ],
    {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    },
  );
  if (commandOutput != 0) {
    throw new Error(`Error in 'git' - ${error}`);
  }
  return output.split("\n").map(line => {
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
