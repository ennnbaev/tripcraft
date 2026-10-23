-- Fields from the trip form that V1 did not store
ALTER TABLE trips
    ADD COLUMN notes    TEXT,
    ADD COLUMN language VARCHAR(30) NOT NULL DEFAULT 'English';

CREATE INDEX idx_ai_requests_trip ON ai_requests (trip_id);
