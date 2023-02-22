# Periodic Changelog
This GitHub Action automates periodically generating pull requests for changelogs within directories (domains).

### Why?
Changelogs within domains (often directories) provide a historical perspective on why changes were made to a domain. Changes (pull requests) often simultaneously affect multiple domains at once, and the title of pull request often focuses on the impact to one of the domains (the domain primarily being affected) without carrying enough context to explain why changes in other domains occurred. The goal of the changelog in each domain is to capture the nature of each change from its own perspective.

For example, here's a sample Django application with changelogs nested within Django apps (domains).
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
