-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add UUID column to leads table
ALTER TABLE "public"."leads" 
  ADD COLUMN "uuid" UUID DEFAULT uuid_generate_v4() NOT NULL;

-- Add a unique constraint to the UUID column
ALTER TABLE "public"."leads"
  ADD CONSTRAINT "leads_uuid_key" UNIQUE ("uuid");

-- Update existing rows with UUIDs
UPDATE "public"."leads" SET "uuid" = uuid_generate_v4() WHERE true;

-- Create an index for faster lookups by UUID
CREATE INDEX "leads_uuid_idx" ON "public"."leads" ("uuid");
