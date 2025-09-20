-- Migration: 001_initial_schema
-- Description: Initial database schema for Inked Draw application
-- Created: 2024-01-19
-- 
-- This migration creates the complete database schema including:
-- - User management tables
-- - Product catalog tables (cigars, beers, wines)
-- - User interaction tables
-- - Social features tables
-- - AI recommendation tables
-- - Indexes and constraints
-- - Row Level Security policies
-- - Triggers and functions

-- Load the complete schema
\i '../schema.sql'
