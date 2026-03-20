-- LinkedIn Ads 연동 테이블
CREATE TABLE linkedin_connections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  integration_id   uuid REFERENCES data_integrations(id) ON DELETE SET NULL,
  ad_account_id    text NOT NULL,
  ad_account_urn   text NOT NULL,
  ad_account_name  text,
  access_token     text NOT NULL,
  refresh_token    text,
  token_expires_at timestamptz,
  scope            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(client_id, ad_account_id)
);

CREATE INDEX idx_linkedin_connections_client ON linkedin_connections(client_id);

ALTER TABLE linkedin_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_linkedin_connections" ON linkedin_connections FOR ALL USING (is_admin());
CREATE POLICY "client_own_linkedin_connections" ON linkedin_connections FOR SELECT USING (client_id = current_client_id());
