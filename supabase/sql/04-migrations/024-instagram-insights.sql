-- Instagram 계정 연결 정보
CREATE TABLE instagram_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  instagram_id        text NOT NULL,
  username            text,
  page_id             text,
  access_token        text NOT NULL,
  token_expires_at    timestamptz,
  followers_count     int,
  media_count         int,
  profile_picture_url text,
  status              text NOT NULL DEFAULT 'active',
  error_message       text,
  last_synced_at      timestamptz,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(client_id, instagram_id)
);

-- 일별 팔로워/노출/도달 집계
CREATE TABLE instagram_daily_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stat_date       date NOT NULL,
  followers_count int,
  impressions     int,
  reach           int,
  profile_views   int,
  website_clicks  int,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(account_id, stat_date)
);

-- 게시물별 성과
CREATE TABLE instagram_media_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  media_id        text NOT NULL,
  media_type      text,
  caption         text,
  media_url       text,
  thumbnail_url   text,
  posted_at       timestamptz,
  like_count      int DEFAULT 0,
  comments_count  int DEFAULT 0,
  saved_count     int DEFAULT 0,
  reach           int DEFAULT 0,
  impressions     int DEFAULT 0,
  engagement_rate numeric(6,4),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(account_id, media_id)
);

-- 부스팅 기간 마킹
CREATE TABLE boosting_periods (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  account_id       uuid REFERENCES instagram_accounts(id) ON DELETE SET NULL,
  label            text NOT NULL,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  budget_won       int,
  platform         text DEFAULT 'instagram',
  meta_campaign_id text,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_instagram_daily_stats_account_date ON instagram_daily_stats(account_id, stat_date);
CREATE INDEX idx_instagram_daily_stats_client ON instagram_daily_stats(client_id, stat_date);
CREATE INDEX idx_instagram_media_metrics_account ON instagram_media_metrics(account_id, posted_at DESC);
CREATE INDEX idx_boosting_periods_client ON boosting_periods(client_id, start_date);

-- RLS
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_media_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosting_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_instagram_accounts" ON instagram_accounts FOR ALL USING (is_admin());
CREATE POLICY "admin_all_instagram_daily_stats" ON instagram_daily_stats FOR ALL USING (is_admin());
CREATE POLICY "admin_all_instagram_media_metrics" ON instagram_media_metrics FOR ALL USING (is_admin());
CREATE POLICY "admin_all_boosting_periods" ON boosting_periods FOR ALL USING (is_admin());

CREATE POLICY "client_own_instagram_accounts" ON instagram_accounts FOR SELECT USING (client_id = current_client_id());
CREATE POLICY "client_own_instagram_daily_stats" ON instagram_daily_stats FOR SELECT USING (client_id = current_client_id());
CREATE POLICY "client_own_instagram_media_metrics" ON instagram_media_metrics FOR SELECT USING (client_id = current_client_id());
CREATE POLICY "client_own_boosting_periods" ON boosting_periods FOR SELECT USING (client_id = current_client_id());
