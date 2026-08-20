-- The whole of EveryKit's server-side state.
--
-- One table, one row per person, and deliberately nothing that could identify
-- what they made. No IP addresses, no user agents, no session ids, no record of
-- which photo or letter was produced — those never leave the browser and there
-- is nowhere here to put them.
--
-- Applied by docker-compose on a local database, and run by hand once against
-- the hosted one. Safe to re-run.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS emails (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- citext so Ahad@x.com and ahad@x.com cannot both get in. The endpoint
  -- lowercases as well; this is the backstop that makes UNIQUE mean something.
  email CITEXT NOT NULL UNIQUE,
  -- Which kit someone came through first. Kept because it is the only signal
  -- of what is actually pulling people in.
  first_kit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hits INT NOT NULL DEFAULT 1
);

-- Aggregate page counts. Additive: this file stays safe to re-run.
--
-- What a row says: on this day, this kit's page at this path was viewed this
-- many times. That is the whole of it. There is deliberately nowhere here to
-- put an IP address, a user agent, a session id, a referrer or a visitor id,
-- because the endpoint that writes these reads none of them. Two people and
-- one person twice are the same row, and neither can be told apart afterwards
-- by us or by anybody who takes a copy of this table.
--
-- Counting by (day, kit, path) rather than by event keeps the table small: a
-- year of eleven kits at a few dozen paths each is thousands of rows, not
-- millions, so nothing here ever needs rolling up or expiring.
CREATE TABLE IF NOT EXISTS pageviews (
  day DATE NOT NULL,
  kit TEXT NOT NULL,
  path TEXT NOT NULL,
  count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kit, path)
);
