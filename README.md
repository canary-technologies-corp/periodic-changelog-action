# Periodic Changelog
This GitHub Action automates periodically generating pull requests for changelogs within directories (domains).

### Why?
Changelogs within domains (often directories) provide a historical perspective on why changes were made to a domain. Changes (pull requests) often simultaneously affect multiple domains at once, and the title of pull request often focuses on the impact to one of the domains (the domain primarily being affected) without carrying enough context to explain why changes in other domains occurred. The goal of the changelog in each domain is to capture the nature of each change from its own perspective.

For example, here's a sample Django application with changelogs nested within apps (aka domains).
```
root
├─ authors
│  ├─ migrations
│  ├─ CHANGELOG.md
│  ├─ admin.py
│  ├─ apps.py
│  ├─ models.py
│  ├─ tests.py
│  ├─ views.py
│  └─ urls.py
└─ books
   ├─ migrations
   ├─ CHANGELOG.md
   ├─ admin.py
   ├─ apps.py
   ├─ models.py
   ├─ tests.py
   ├─ views.py
   └─ urls.py
```
Each app (`authors` and `books`) maintains its own changelog, however, pull requests often cross the boundary between the two domains.

Periodic Changelog captures commits affecting the directory of each changelog and prepares a pull request appending to each changelog. Owners can then edit the pull requests to specific to the domain before merging for a continuous history.

## Changelog format
```md
# Example changelog
Description of the domain. The header section of the changelog is anything above the first divider. It won't be touched by the automation.
* Owner: [<username>, ...]
* Notify: [<username>, ...]

---

## 2023.01
* Fake change ([#5](https://github.com/canary-technologies-corp/periodic-changelog-action/pull/5))

---

Last ran: 2023-02-22T14:03:39.241Z
```
**Notes**:
* Include `Owner:` followed by comma-separated usernames to request a review upon PR creation
* Include `Notify:` followed by comma-separated usernames to set as assignee upon PR creation
* `Last run: ...` in the footer section determines the time range to considered on the next run. Commits prior to the "last ran" time will be ignored.


## Setup
Example setup to run every week at the start of Sunday:
```yml
name: Changelogs
on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * 0"
jobs:
  changelogs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0 # Required: fetch all history for the repository.
      - uses: canary-technologies-corp/periodic-changelog-action@v1
```

## Publish notifications to Slack
This action supports publishing changelog updates to Slack when changelog pull requests are merged. 

Here's an example message:

<img width="393" alt="image" src="https://user-images.githubusercontent.com/987656/221193527-c6e20bd8-77f4-406d-968d-488d4094d701.png">
Actual pull request: https://github.com/canary-technologies-corp/periodic-changelog-action/pull/18

### Configuration
```yml
name: Changelog - Notify Slack
on:
  pull_request:
    branches: [main]
    types: [labeled, closed]

jobs:
  notify-slack:
    if: github.event.pull_request.merged == true && contains(github.event.pull_request.labels.*.name, 'Changelog')
    runs-on: ubuntu-latest
    steps:
      - uses: ./
        with:
          operation: notify_slack
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
```
Create SLACK_WEBHOOK secret using GitHub Action's Secret. You can [generate a Slack incoming webhook token from here](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks).

---

## Publish a release
Notes:
* Actions are run from GitHub repos so the packaged `dist` folder needs to be committed.
* This repo follows the [action versioning guide](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md). Major version tags (example: `v1`) are moved with each release. Additionally, each release is tagged with a specific version (example: `v1.0.0`).

Here are the release steps:
1. Package the new version.
    ```
    $ git checkout main
    $ npm ci && npm run build && npm run publish
    $ git add dist
    $ git commit -a -m "Packaged action"
    $ git push
    ```
2. Tag the new version (replace `vX.X.X`).
    ```
    $ git tag -fa vX.X.X -m "Adds vX.X.X tag"
    $ git push origin vX.X.X
    ```
3. Move the major version tag (replace `vX` with major version).
    ```
    $ git tag -fa vX -m "Moves vX tag"
    $ git push origin vX --force
    ```
4. Create a release [through the UI](https://github.com/canary-technologies-corp/periodic-changelog-action/releases/new).