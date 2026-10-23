# TripCraft: notes for AI coding assistants

Read `docs/PRD.md` first; it is the source of truth for features, API, data model and prompt templates.

## Conventions
- Backend package root: `com.tripcraft`. Feature packages: `ai`, `trip`, `stats`, `config`, `common`, `web`.
- DTOs and AI response models are Java `record`s. Entities use Lombok.
- DB schema changes only through new Flyway migrations (`V2__...sql`), never edit `V1`.
- JSONB columns map with `@JdbcTypeCode(SqlTypes.JSON)`.
- All LLM calls go through Spring AI `ChatClient`; never call a provider SDK directly. Every call is logged to `ai_requests`.
- Prompt templates live in `src/main/resources/prompts/*.st`; no prompt text hard-coded in Java.
- Frontend: TypeScript, Tailwind, TanStack Query for server state, API calls via `src/api/client.ts`.

## Commands
- DB: `docker compose up -d`
- Backend: `cd backend && ./mvnw spring-boot:run` (needs `SPRING_PROFILES_ACTIVE`; `mock` works without `AI_API_KEY`). Tests: `./mvnw test`
- Frontend (Node 22+): `cd frontend && npm run dev`, build check: `npm run build`
