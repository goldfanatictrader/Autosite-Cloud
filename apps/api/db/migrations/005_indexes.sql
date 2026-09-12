-- Unique constraints declared with their tables already provide indexes for
-- users.email and analytics(site_id, date).
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id
  ON workspaces (owner_id);

CREATE INDEX IF NOT EXISTS idx_sites_workspace_id_status
  ON sites (workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_site_content_site_id
  ON site_content (site_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_site_id_domain
  ON domains (site_id, domain);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read_created_at
  ON notifications (user_id, read, created_at);

CREATE INDEX IF NOT EXISTS idx_templates_category
  ON templates (category);
