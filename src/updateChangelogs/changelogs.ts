import * as glob from "@actions/glob";

export async function findChangelogs(): Promise<string[]> {
  const patterns = ["*/**/CHANGELOG.md", "!**/node_modules"];
  const globber = await glob.create(patterns.join("\n"), {
    followSymbolicLinks: false,
  });
  return globber.glob();
}
