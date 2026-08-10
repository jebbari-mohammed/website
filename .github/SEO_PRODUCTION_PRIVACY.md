# SEO Production Privacy

The repository is public, but Search Console query and landing-page evidence is business-sensitive. The production design therefore follows these rules:

1. Raw GSC exports are written only to gitignored paths with restrictive file permissions.
2. Exact queries are not echoed to Actions logs or summaries.
3. Public commit messages and workflow summaries use a 12-character SHA-256 query hash.
4. Expert plans, publication state, experiment baselines, and last-publication records stay in private Actions state/cache.
5. Only `public/` website output may be staged by the production publisher.
6. Credentials are validated structurally without printing the service-account email, private key, or API key.
7. Failure issues contain only a workflow URL and generic failure category.
8. Dry-run CI proves the complete path without writing public files.

A query hash is an operational correlation identifier, not a reversible encoding of the query.
