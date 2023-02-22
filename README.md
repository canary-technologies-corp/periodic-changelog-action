# Periodic Changelog
This GitHub Action automates periodically capturing changelogs for directories within a repository.

### Why?
Changelogs within domains (often directories) provide a historical perspective on why changes were made to a domain. Changes (pull requests) often simultaneously affect multiple domains at once. The title of pull request often focuses on the impact to one of the domains (the domain primarily being affected) without carrying enough context to explain why the change within other domains occurred. The goal of the changelog in each domain is to capture the nature of each change from the perspective of each domain.

For example, here's a sample Django application with changelogs nested within Django apps.
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
