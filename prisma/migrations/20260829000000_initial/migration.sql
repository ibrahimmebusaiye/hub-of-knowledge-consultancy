-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'SESSION_START', 'CONTACT_SUBMISSION');

-- CreateEnum
CREATE TYPE "DeviceCategory" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN');

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "ip_hash" CHAR(64),
    "user_agent_hash" CHAR(64),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "analytics_session_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "organisation" VARCHAR(160),
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(40),
    "service" VARCHAR(160),
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'NEW',
    "email_notification_at" TIMESTAMPTZ(3),
    "email_delivery_error" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_sessions" (
    "id" UUID NOT NULL,
    "session_id_hash" CHAR(64) NOT NULL,
    "visitor_id_hash" CHAR(64) NOT NULL,
    "first_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "landing_page" VARCHAR(500) NOT NULL,
    "source" VARCHAR(80) NOT NULL,
    "referrer_domain" VARCHAR(255),
    "country_code" CHAR(2),
    "country_name" VARCHAR(100),
    "device_category" "DeviceCategory" NOT NULL DEFAULT 'UNKNOWN',
    "browser" VARCHAR(80),
    "operating_system" VARCHAR(80),
    "utm_source" VARCHAR(160),
    "utm_medium" VARCHAR(160),
    "utm_campaign" VARCHAR(200),
    "utm_content" VARCHAR(200),
    "utm_term" VARCHAR(200),

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "event_type" "AnalyticsEventType" NOT NULL,
    "page" VARCHAR(500) NOT NULL,
    "page_title" VARCHAR(300),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "id" UUID NOT NULL,
    "key_hash" CHAR(64) NOT NULL,
    "route" VARCHAR(80) NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(80),
    "target_id" VARCHAR(100),
    "details" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "admin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_id_expires_at_idx" ON "admin_sessions"("admin_id", "expires_at");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "contact_messages_status_created_at_idx" ON "contact_messages"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_sessions_session_id_hash_key" ON "analytics_sessions"("session_id_hash");

-- CreateIndex
CREATE INDEX "analytics_sessions_first_seen_at_idx" ON "analytics_sessions"("first_seen_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_last_seen_at_idx" ON "analytics_sessions"("last_seen_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_visitor_id_hash_first_seen_at_idx" ON "analytics_sessions"("visitor_id_hash", "first_seen_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_source_first_seen_at_idx" ON "analytics_sessions"("source", "first_seen_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_country_code_first_seen_at_idx" ON "analytics_sessions"("country_code", "first_seen_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_device_category_first_seen_at_idx" ON "analytics_sessions"("device_category", "first_seen_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_utm_campaign_first_seen_at_idx" ON "analytics_sessions"("utm_campaign", "first_seen_at");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_created_at_idx" ON "analytics_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_session_id_created_at_idx" ON "analytics_events"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_page_created_at_idx" ON "analytics_events"("page", "created_at");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "rate_limit_buckets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_buckets_key_hash_route_window_start_key" ON "rate_limit_buckets"("key_hash", "route", "window_start");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_created_at_idx" ON "audit_logs"("admin_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_analytics_session_id_fkey" FOREIGN KEY ("analytics_session_id") REFERENCES "analytics_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
