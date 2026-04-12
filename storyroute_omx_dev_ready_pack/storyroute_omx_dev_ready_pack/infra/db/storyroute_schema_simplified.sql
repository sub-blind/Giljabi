-- storyroute_schema_simplified.sql
-- PostgreSQL 16+ / PostGIS / pgvector
-- Simplified schema for StoryRoute AI
-- Goal: fewer tables, preserve source traceability, keep hybrid search + graph + itinerary support.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS ref;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS feature;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS search;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS app;

-- ---------------------------------------------------------------------------
-- ops
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ops.dataset_source (
    dataset_source_id         BIGSERIAL PRIMARY KEY,
    dataset_key               TEXT NOT NULL UNIQUE,
    dataset_name              TEXT NOT NULL,
    provider_name             TEXT NOT NULL DEFAULT '한국관광공사',
    source_type               TEXT NOT NULL CHECK (source_type IN ('openapi', 'file', 'lod', 'manual')),
    base_url                  TEXT,
    update_mode               TEXT NOT NULL CHECK (update_mode IN ('full', 'incremental', 'snapshot', 'manual')),
    is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
    note                      TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ops.ingestion_run (
    ingestion_run_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_source_id         BIGINT NOT NULL REFERENCES ops.dataset_source(dataset_source_id),
    job_name                  TEXT NOT NULL,
    run_type                  TEXT NOT NULL CHECK (run_type IN ('bootstrap', 'incremental', 'snapshot', 'repair', 'manual')),
    status                    TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'cancelled')),
    request_summary           JSONB,
    object_count              BIGINT NOT NULL DEFAULT 0,
    inserted_count            BIGINT NOT NULL DEFAULT 0,
    updated_count             BIGINT NOT NULL DEFAULT 0,
    failed_count              BIGINT NOT NULL DEFAULT 0,
    error_message             TEXT,
    started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at                  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ops_ingestion_run_lookup
    ON ops.ingestion_run (dataset_source_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- raw
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.source_payload (
    source_payload_id         BIGSERIAL PRIMARY KEY,
    ingestion_run_id          UUID NOT NULL REFERENCES ops.ingestion_run(ingestion_run_id),
    dataset_source_id         BIGINT NOT NULL REFERENCES ops.dataset_source(dataset_source_id),
    payload_kind              TEXT NOT NULL CHECK (payload_kind IN ('api_page', 'file_record', 'snapshot_meta')),
    endpoint_name             TEXT,
    source_object_type        TEXT,
    source_object_id          TEXT,
    natural_key               TEXT,
    page_no                   INTEGER,
    source_version            TEXT,
    request_json              JSONB,
    payload                   JSONB NOT NULL,
    payload_hash              TEXT,
    fetched_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_source_payload_lookup
    ON raw.source_payload (dataset_source_id, endpoint_name, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_raw_source_payload_object
    ON raw.source_payload (dataset_source_id, source_object_type, source_object_id);

-- ---------------------------------------------------------------------------
-- ref
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ref.region_code (
    region_code_id            BIGSERIAL PRIMARY KEY,
    code_system               TEXT NOT NULL CHECK (code_system IN ('tourapi_area', 'tourapi_sigungu', 'legal_dong')),
    region_level              TEXT NOT NULL CHECK (region_level IN ('area', 'sigungu', 'sido', 'legal_sigungu', 'emd')),
    code                      TEXT NOT NULL,
    parent_code_system        TEXT,
    parent_code               TEXT,
    area_code                 VARCHAR(10),
    sigungu_code              VARCHAR(10),
    legal_dong_code           VARCHAR(30),
    region_name               TEXT NOT NULL,
    aliases                   TEXT[],
    metadata_json             JSONB,
    source_updated_at         TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code_system, code)
);

CREATE INDEX IF NOT EXISTS idx_ref_region_name_trgm
    ON ref.region_code USING gin (region_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS ref.taxonomy_code (
    taxonomy_code_id          BIGSERIAL PRIMARY KEY,
    taxonomy_type             TEXT NOT NULL CHECK (taxonomy_type IN ('category', 'classification')),
    depth                     SMALLINT NOT NULL CHECK (depth IN (1, 2, 3)),
    code                      TEXT NOT NULL,
    parent_code               TEXT,
    code1                     TEXT NOT NULL,
    code2                     TEXT,
    code3                     TEXT,
    display_name              TEXT NOT NULL,
    is_leaf                   BOOLEAN NOT NULL DEFAULT FALSE,
    metadata_json             JSONB,
    source_updated_at         TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (taxonomy_type, code)
);

CREATE INDEX IF NOT EXISTS idx_ref_taxonomy_name_trgm
    ON ref.taxonomy_code USING gin (display_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- core
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS core.place (
    place_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_title           TEXT NOT NULL,
    title_normalized          TEXT NOT NULL,
    primary_dataset_source_id BIGINT REFERENCES ops.dataset_source(dataset_source_id),
    content_id                BIGINT,
    content_type_id           INTEGER,
    source_uri                TEXT,
    status                    TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'inactive')),
    merged_into_place_id      UUID REFERENCES core.place(place_id),
    place_kind                TEXT NOT NULL,
    area_code                 VARCHAR(10),
    sigungu_code              VARCHAR(10),
    legal_dong_code           VARCHAR(30),
    category_code             TEXT,
    classification_code       TEXT,
    road_address              TEXT,
    lotno_address             TEXT,
    zipcode                   TEXT,
    tel                       TEXT,
    tel_name                  TEXT,
    map_x                     NUMERIC(12,8),
    map_y                     NUMERIC(12,8),
    geom                      geometry(Point, 4326),
    mlevel                    INTEGER,
    default_image_url         TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (map_x IS NULL AND map_y IS NULL AND geom IS NULL)
        OR (map_x IS NOT NULL AND map_y IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_core_place_content
    ON core.place (content_id, content_type_id)
    WHERE content_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_core_place_source_uri
    ON core.place (source_uri)
    WHERE source_uri IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_core_place_title_trgm
    ON core.place USING gin (title_normalized gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_core_place_geom
    ON core.place USING gist (geom);

CREATE INDEX IF NOT EXISTS idx_core_place_region
    ON core.place (area_code, sigungu_code, content_type_id);

CREATE TABLE IF NOT EXISTS core.place_source_map (
    place_source_map_id       BIGSERIAL PRIMARY KEY,
    place_id                  UUID NOT NULL REFERENCES core.place(place_id),
    dataset_source_id         BIGINT NOT NULL REFERENCES ops.dataset_source(dataset_source_id),
    source_object_type        TEXT NOT NULL,
    source_object_id          TEXT NOT NULL,
    source_sub_id             TEXT,
    match_method              TEXT NOT NULL CHECK (match_method IN ('direct_id', 'uri', 'name_geo', 'name_address', 'manual')),
    confidence_score          NUMERIC(6,5),
    is_primary                BOOLEAN NOT NULL DEFAULT FALSE,
    raw_pointer_json          JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_core_place_source_map
    ON core.place_source_map (dataset_source_id, source_object_type, source_object_id, COALESCE(source_sub_id, ''));

CREATE INDEX IF NOT EXISTS idx_core_place_source_map_place
    ON core.place_source_map (place_id, dataset_source_id);

CREATE TABLE IF NOT EXISTS core.place_profile (
    place_id                  UUID PRIMARY KEY REFERENCES core.place(place_id) ON DELETE CASCADE,
    aliases_json              JSONB,
    overview                  TEXT,
    homepage_url              TEXT,
    detail_json               JSONB NOT NULL DEFAULT '{}'::jsonb,
    intro_json                JSONB NOT NULL DEFAULT '{}'::jsonb,
    repeat_json               JSONB NOT NULL DEFAULT '[]'::jsonb,
    accessibility_json        JSONB,
    pet_json                  JSONB,
    wellness_json             JSONB,
    derived_use_time_text     TEXT,
    derived_rest_date_text    TEXT,
    derived_parking_text      TEXT,
    event_start_date          DATE,
    event_end_date            DATE,
    checkin_time              TEXT,
    checkout_time             TEXT,
    spend_time_text           TEXT,
    pet_allowed               BOOLEAN,
    has_wheelchair_access     BOOLEAN,
    has_accessible_parking    BOOLEAN,
    has_accessible_restroom   BOOLEAN,
    has_elevator              BOOLEAN,
    wellness_type             TEXT,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_place_profile_event_range
    ON core.place_profile (event_start_date, event_end_date);

CREATE TABLE IF NOT EXISTS core.place_asset (
    asset_id                  BIGSERIAL PRIMARY KEY,
    place_id                  UUID NOT NULL REFERENCES core.place(place_id) ON DELETE CASCADE,
    asset_kind                TEXT NOT NULL CHECK (asset_kind IN ('image', 'thumbnail', 'audio', 'script', 'link', 'document', 'video')),
    asset_subtype             TEXT,
    language_code             VARCHAR(16) NOT NULL DEFAULT 'ko',
    title                     TEXT,
    url                       TEXT,
    body_text                 TEXT,
    sort_order                INTEGER NOT NULL DEFAULT 0,
    is_primary                BOOLEAN NOT NULL DEFAULT FALSE,
    width                     INTEGER,
    height                    INTEGER,
    metadata_json             JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_core_place_asset_url
    ON core.place_asset (place_id, asset_kind, COALESCE(url, ''), COALESCE(md5(COALESCE(body_text, '')), ''));

CREATE INDEX IF NOT EXISTS idx_core_place_asset_primary
    ON core.place_asset (place_id, is_primary DESC, sort_order ASC);

CREATE TABLE IF NOT EXISTS core.place_label (
    place_label_id            BIGSERIAL PRIMARY KEY,
    place_id                  UUID NOT NULL REFERENCES core.place(place_id) ON DELETE CASCADE,
    label_type                TEXT NOT NULL CHECK (label_type IN ('tag', 'certification', 'badge')),
    label_source              TEXT NOT NULL,
    label_key                 TEXT NOT NULL,
    label_value               TEXT NOT NULL,
    authority                 TEXT,
    weight                    NUMERIC(10,6),
    valid_from                DATE,
    valid_to                  DATE,
    metadata_json             JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (place_id, label_type, label_source, label_key, label_value)
);

CREATE INDEX IF NOT EXISTS idx_core_place_label_lookup
    ON core.place_label (place_id, label_type, label_source, weight DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- feature
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feature.entity_relation (
    entity_relation_id        BIGSERIAL PRIMARY KEY,
    subject_type              TEXT NOT NULL CHECK (subject_type IN ('place', 'region', 'resource')),
    subject_id                TEXT NOT NULL,
    object_type               TEXT NOT NULL CHECK (object_type IN ('place', 'region', 'resource')),
    object_id                 TEXT NOT NULL,
    dataset_source_id         BIGINT REFERENCES ops.dataset_source(dataset_source_id),
    relation_type             TEXT NOT NULL,
    relation_group            TEXT,
    area_code                 VARCHAR(10),
    sigungu_code              VARCHAR(10),
    rank_no                   INTEGER,
    score                     NUMERIC(18,6),
    period_start              DATE,
    period_end                DATE,
    vehicle_based             BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score          NUMERIC(6,5),
    metadata_json             JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_entity_relation
    ON feature.entity_relation (
        subject_type,
        subject_id,
        object_type,
        object_id,
        COALESCE(dataset_source_id, -1),
        relation_type,
        COALESCE(relation_group, ''),
        COALESCE(period_start, DATE '1900-01-01'),
        COALESCE(period_end, DATE '1900-01-01')
    );

CREATE INDEX IF NOT EXISTS idx_feature_entity_relation_subject
    ON feature.entity_relation (subject_type, subject_id, relation_type, score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_feature_entity_relation_object
    ON feature.entity_relation (object_type, object_id, relation_type, score DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS feature.knowledge_triple (
    knowledge_triple_id       BIGSERIAL PRIMARY KEY,
    dataset_source_id         BIGINT NOT NULL REFERENCES ops.dataset_source(dataset_source_id),
    subject_uri               TEXT NOT NULL,
    predicate_uri             TEXT NOT NULL,
    object_uri                TEXT,
    object_literal            TEXT,
    object_lang               VARCHAR(16),
    subject_place_id          UUID REFERENCES core.place(place_id),
    object_place_id           UUID REFERENCES core.place(place_id),
    metadata_json             JSONB,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (object_uri IS NOT NULL AND object_literal IS NULL)
        OR (object_uri IS NULL AND object_literal IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_feature_knowledge_subject
    ON feature.knowledge_triple (subject_uri, predicate_uri);

CREATE INDEX IF NOT EXISTS idx_feature_knowledge_subject_place
    ON feature.knowledge_triple (subject_place_id, predicate_uri);

-- ---------------------------------------------------------------------------
-- content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS content.resource (
    resource_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type             TEXT NOT NULL CHECK (resource_type IN ('article', 'guidebook', 'region_content', 'portal')),
    dataset_source_id         BIGINT NOT NULL REFERENCES ops.dataset_source(dataset_source_id),
    source_object_id          TEXT,
    title                     TEXT,
    subtitle                  TEXT,
    region_scope_json         JSONB,
    url                       TEXT NOT NULL,
    hero_image_url            TEXT,
    published_at              DATE,
    body_text                 TEXT,
    metadata_json             JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_resource_source
    ON content.resource (dataset_source_id, COALESCE(source_object_id, url));

-- ---------------------------------------------------------------------------
-- search
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS search.search_chunk (
    search_chunk_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type               TEXT NOT NULL CHECK (entity_type IN ('place', 'resource', 'region', 'narrative')),
    entity_id                 TEXT NOT NULL,
    place_id                  UUID REFERENCES core.place(place_id),
    language_code             VARCHAR(16) NOT NULL DEFAULT 'ko',
    chunk_index               INTEGER NOT NULL,
    title                     TEXT NOT NULL,
    body                      TEXT NOT NULL,
    tsv                       TSVECTOR,
    embedding                 VECTOR(1536),
    facet_json                JSONB,
    source_priority           INTEGER NOT NULL DEFAULT 0,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entity_type, entity_id, language_code, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_search_chunk_tsv
    ON search.search_chunk USING gin (tsv);

-- Create a vector index separately after enough data is loaded.
-- Example:
-- CREATE INDEX idx_search_chunk_embedding_hnsw
--   ON search.search_chunk USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_search_chunk_entity
    ON search.search_chunk (entity_type, entity_id, language_code, chunk_index);

-- ---------------------------------------------------------------------------
-- analytics
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.region_metric (
    region_metric_id          BIGSERIAL PRIMARY KEY,
    dataset_source_id         BIGINT NOT NULL REFERENCES ops.dataset_source(dataset_source_id),
    metric_family             TEXT NOT NULL,
    metric_code               TEXT NOT NULL,
    metric_name               TEXT NOT NULL,
    metric_date               DATE NOT NULL,
    date_granularity          TEXT NOT NULL CHECK (date_granularity IN ('day', 'month')),
    admin_level               TEXT NOT NULL CHECK (admin_level IN ('area', 'sigungu')),
    area_code                 VARCHAR(10) NOT NULL,
    sigungu_code              VARCHAR(10),
    value_num                 NUMERIC(20,6) NOT NULL,
    value_unit                TEXT,
    dimensions_json           JSONB,
    raw_payload               JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_analytics_region_metric
    ON analytics.region_metric (
        dataset_source_id,
        metric_family,
        metric_code,
        metric_date,
        date_granularity,
        admin_level,
        area_code,
        COALESCE(sigungu_code, ''),
        COALESCE(md5(COALESCE(dimensions_json::TEXT, '')), '')
    );

CREATE INDEX IF NOT EXISTS idx_analytics_region_metric_lookup
    ON analytics.region_metric (metric_family, area_code, sigungu_code, metric_date DESC);

-- ---------------------------------------------------------------------------
-- app
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app.user_account (
    user_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                     CITEXT UNIQUE,
    auth_provider             TEXT,
    auth_provider_user_id     TEXT,
    display_name              TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (auth_provider, auth_provider_user_id)
);

CREATE TABLE IF NOT EXISTS app.user_event (
    user_event_id             BIGSERIAL PRIMARY KEY,
    user_id                   UUID REFERENCES app.user_account(user_id),
    session_id                UUID,
    event_type                TEXT NOT NULL CHECK (event_type IN ('search', 'result_action', 'place_view', 'recommendation', 'share', 'save', 'agent_request')),
    event_name                TEXT,
    entity_type               TEXT,
    entity_id                 TEXT,
    query_text                TEXT,
    intent_json               JSONB,
    payload_json              JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_user_event_lookup
    ON app.user_event (user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_user_event_entity
    ON app.user_event (entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app.saved_collection (
    collection_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL REFERENCES app.user_account(user_id),
    name                      TEXT NOT NULL,
    visibility                TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared_link')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.saved_collection_item (
    collection_id             UUID NOT NULL REFERENCES app.saved_collection(collection_id) ON DELETE CASCADE,
    place_id                  UUID NOT NULL REFERENCES core.place(place_id),
    sort_order                INTEGER NOT NULL DEFAULT 0,
    memo                      TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (collection_id, place_id)
);

CREATE TABLE IF NOT EXISTS app.itinerary (
    itinerary_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID REFERENCES app.user_account(user_id),
    title                     TEXT NOT NULL,
    region_scope_json         JSONB,
    travel_start_date         DATE,
    travel_end_date           DATE,
    companions_json           JSONB,
    constraints_json          JSONB,
    status                    TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_by_agent          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_itinerary_user_updated
    ON app.itinerary (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS app.itinerary_stop (
    itinerary_stop_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id              UUID NOT NULL REFERENCES app.itinerary(itinerary_id) ON DELETE CASCADE,
    day_no                    INTEGER NOT NULL,
    travel_date               DATE,
    place_id                  UUID REFERENCES core.place(place_id),
    visit_order               INTEGER NOT NULL,
    start_time                TIME,
    end_time                  TIME,
    stay_minutes              INTEGER,
    transport_mode            TEXT,
    stop_type                 TEXT NOT NULL DEFAULT 'place',
    agent_reason              TEXT,
    manual_note               TEXT,
    stop_meta_json            JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (itinerary_id, day_no, visit_order)
);

CREATE INDEX IF NOT EXISTS idx_app_itinerary_stop_place
    ON app.itinerary_stop (place_id);

CREATE TABLE IF NOT EXISTS app.agent_run (
    agent_run_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID REFERENCES app.user_account(user_id),
    itinerary_id              UUID REFERENCES app.itinerary(itinerary_id),
    request_text              TEXT NOT NULL,
    context_json              JSONB,
    model_name                TEXT,
    status                    TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'cancelled')),
    result_summary_json       JSONB,
    trace_json                JSONB,
    started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at                  TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Recommended dataset keys
-- ---------------------------------------------------------------------------
-- kto_tourapi_kor
-- kto_accessible_travel
-- kto_pet_travel
-- kto_related_attraction
-- kto_region_hub_attraction
-- kto_lod_place
-- kto_storytelling_db
-- kto_audio_guide_odii
-- kto_bigdata_visitor
-- kto_tourism_diversity
-- kto_tourism_demand_strength
-- kto_travel_article
-- kto_region_content
-- kto_region_portal
-- kto_guidebook
-- kto_quality_certification
-- kto_tourism100
-- kto_tour_photo
