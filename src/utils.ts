export function asRelative(changelogFilename: string): string {
  return changelogFilename.replace(`${process.cwd()}/`, "");
}
