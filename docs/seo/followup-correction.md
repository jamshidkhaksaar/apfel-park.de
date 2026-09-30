# Follow-up crawl correction

First follow-up audit e2a6cef2-58af-4e0d-ad7e-23bc47a4484f completed with 750/750 pages. All original duplicate groups, long titles/descriptions and broken email links disappeared. However it exposed 126 cross-locale duplicate-title rows (63 pairs), introduced because English product titles no longer retained their prior Buy prefix; new/open-box titles can be otherwise identical across locales. No same-locale duplicates remained.

This is treated as a regression, not a successful final crawl. Full issue rows are retained locally in audit-intermediate.json. TDD added the actual iPad open-box fixture and reproduced identical German/English titles. The minimal correction restores explicit English Buy purchase intent inside the existing title budget (rather than appending a generic locale code). The original attribute/identity and 60-character safeguards remain intact.

The corrective commit must pass targeted/full gates and independent review, deploy through the canonical script as an exact pushed descendant of live a23de514d0992d954f8199e44135ef08229a2989, and receive a second completed postdeploy crawl before final completion.
