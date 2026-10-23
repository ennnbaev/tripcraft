# Prompt templates

Spring AI `PromptTemplate` files (StringTemplate syntax, variables in `{braces}`).
Each file is versioned; the version is written to `ai_requests.template_version`.

Planned templates (see docs/PRD.md, section 6):

| File | Purpose |
|---|---|
| `itinerary-system.st` | System role and rules for every itinerary call |
| `itinerary-generate.st` | Generate a full trip from the form inputs |
| `day-regenerate.st` | Rebuild one day using the user's feedback |
| `packing-list.st` | Packing list for destination, season, activities |
