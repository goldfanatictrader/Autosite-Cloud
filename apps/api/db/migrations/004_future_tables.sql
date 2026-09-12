CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  domain VARCHAR(255) UNIQUE NOT NULL,
  status domain_status NOT NULL DEFAULT 'pending',
  ssl_status ssl_status NOT NULL DEFAULT 'pending',
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  date DATE NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  top_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_referrers JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  bounce_rate DECIMAL(5, 2),
  avg_duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, date)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  theme theme NOT NULL DEFAULT 'system',
  language VARCHAR(10) NOT NULL DEFAULT 'en'
);
