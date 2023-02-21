import glob from "@actions/glob";


export async function findChangelogs(): Promise<string[]> {
  const patterns = ["**/CHANGELOG.md"];
  const globber = await glob.create(patterns.join('\n'));
  return globber.glob();
}
