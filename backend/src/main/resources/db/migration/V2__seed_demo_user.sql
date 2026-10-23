-- Single demo user: every trip belongs to it until authentication exists (PRD, Phase 3)
INSERT INTO users (email, name)
VALUES ('demo@tripcraft.local', 'Demo Traveler')
ON CONFLICT (email) DO NOTHING;
