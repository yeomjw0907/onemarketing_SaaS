-- 자료실 컬렉션 테이블
CREATE TABLE public.asset_collections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT '#6366f1',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_collections_client ON public.asset_collections(client_id);

-- 컬렉션-파일 연결 (junction table)
CREATE TABLE public.asset_collection_items (
  collection_id UUID        NOT NULL REFERENCES public.asset_collections(id) ON DELETE CASCADE,
  asset_id      UUID        NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, asset_id)
);

CREATE INDEX idx_aci_collection ON public.asset_collection_items(collection_id);
CREATE INDEX idx_aci_asset      ON public.asset_collection_items(asset_id);

-- RLS
ALTER TABLE public.asset_collections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_collections" ON public.asset_collections
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'client'
    )
  );

CREATE POLICY "admin_all_collections" ON public.asset_collections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "client_read_own_collection_items" ON public.asset_collection_items
  FOR SELECT USING (
    collection_id IN (
      SELECT ac.id FROM public.asset_collections ac
      JOIN public.profiles p ON p.client_id = ac.client_id
      WHERE p.user_id = auth.uid() AND p.role = 'client'
    )
  );

CREATE POLICY "admin_all_collection_items" ON public.asset_collection_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.asset_collections      IS '자료실 컬렉션 (클라이언트별 파일 묶음)';
COMMENT ON TABLE public.asset_collection_items IS '컬렉션-파일 연결 테이블';
