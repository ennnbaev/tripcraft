-- Initial schema (see docs/PRD.md, section "Data model")

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE trips (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT       REFERENCES users (id) ON DELETE CASCADE,
    destination   VARCHAR(255) NOT NULL,
    start_date    DATE         NOT NULL,
    end_date      DATE         NOT NULL,
    travelers     INT          NOT NULL DEFAULT 1,
    budget_level  VARCHAR(20)  NOT NULL,          -- ECONOMY | MEDIUM | PREMIUM
    pace          VARCHAR(20)  NOT NULL,          -- RELAXED | BALANCED | ACTIVE
    interests     JSONB        NOT NULL DEFAULT '[]',
    itinerary     JSONB,                          -- AI-generated document
    packing_list  JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_user ON trips (user_id);

CREATE TABLE ai_requests (
    id                BIGSERIAL PRIMARY KEY,
    trip_id           BIGINT       REFERENCES trips (id) ON DELETE SET NULL,
    template_name     VARCHAR(100) NOT NULL,
    template_version  VARCHAR(20)  NOT NULL,
    provider          VARCHAR(50)  NOT NULL,
    model             VARCHAR(100) NOT NULL,
    input_tokens      INT,
    output_tokens     INT,
    latency_ms        BIGINT,
    status            VARCHAR(20)  NOT NULL,      -- SUCCESS | INVALID_JSON | ERROR
    error_message     TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_requests_created ON ai_requests (created_at);
