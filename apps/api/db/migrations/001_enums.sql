CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple', 'github');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE plan AS ENUM ('free', 'pro', 'business');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE site_status AS ENUM ('draft', 'building', 'live', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE domain_status AS ENUM (
    'pending',
    'verifying',
    'active',
    'failed',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE ssl_status AS ENUM ('pending', 'active', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE notification_type AS ENUM (
    'publish_complete',
    'domain_reminder',
    'domain_expiring',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE theme AS ENUM ('light', 'dark', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
