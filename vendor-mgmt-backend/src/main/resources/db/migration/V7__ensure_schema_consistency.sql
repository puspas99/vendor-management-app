-- V7: Ensure schema consistency after consolidating V3 and V5 into V1
-- This migration is idempotent and safe to run multiple times

-- Ensure vendor.status column exists with correct constraints
IF COL_LENGTH('dbo.vendor','status') IS NULL
BEGIN
    ALTER TABLE dbo.vendor ADD status NVARCHAR(50) NOT NULL DEFAULT 'REQUESTED';
END

-- Ensure vendor.deleted_at exists
IF COL_LENGTH('dbo.vendor','deleted_at') IS NULL
BEGIN
    ALTER TABLE dbo.vendor ADD deleted_at DATETIME2;
END

-- Ensure vendor_onboarding.status exists
IF COL_LENGTH('dbo.vendor_onboarding','status') IS NULL
BEGIN
    ALTER TABLE dbo.vendor_onboarding ADD status NVARCHAR(50);
END

-- Ensure vendor_onboarding.deleted_at exists
IF COL_LENGTH('dbo.vendor_onboarding','deleted_at') IS NULL
BEGIN
    ALTER TABLE dbo.vendor_onboarding ADD deleted_at DATETIME2;
END

-- Add check constraint to vendor.status if not exists
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_vendor_status' AND parent_object_id = OBJECT_ID('dbo.vendor'))
BEGIN
    ALTER TABLE dbo.vendor ADD CONSTRAINT CK_vendor_status 
    CHECK (status IN ('REQUESTED', 'AWAITING_RESPONSE', 'MISSING_DATA', 'AWAITING_VALIDATION', 'VALIDATED', 'DENIED', 'DELETED'));
END

-- Add check constraint to vendor_onboarding.status if not exists
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_vendor_onboarding_status' AND parent_object_id = OBJECT_ID('dbo.vendor_onboarding'))
BEGIN
    ALTER TABLE dbo.vendor_onboarding ADD CONSTRAINT CK_vendor_onboarding_status 
    CHECK (status IN ('REQUESTED', 'AWAITING_RESPONSE', 'MISSING_DATA', 'AWAITING_VALIDATION', 'VALIDATED', 'DENIED', 'DELETED') OR status IS NULL);
END

-- Clean up any old status values (safe to run multiple times)
-- Handle COMPLETED -> VALIDATED
UPDATE dbo.vendor
SET status = 'VALIDATED'
WHERE UPPER(status) = 'COMPLETED';

UPDATE dbo.vendor_onboarding
SET status = 'VALIDATED'
WHERE UPPER(status) = 'COMPLETED';

-- Handle other legacy status values
UPDATE dbo.vendor
SET status = CASE 
    WHEN UPPER(status) = 'PENDING' THEN 'REQUESTED'
    WHEN UPPER(status) = 'IN_PROGRESS' THEN 'AWAITING_RESPONSE'
    WHEN UPPER(status) = 'DISCARDED' THEN 'DENIED'
    WHEN UPPER(status) = 'ACTIVE' THEN 'VALIDATED'
    ELSE status
END
WHERE UPPER(status) IN ('PENDING', 'IN_PROGRESS', 'DISCARDED', 'ACTIVE');

UPDATE dbo.vendor_onboarding
SET status = CASE 
    WHEN UPPER(status) = 'PENDING' THEN 'REQUESTED'
    WHEN UPPER(status) = 'IN_PROGRESS' THEN 'AWAITING_RESPONSE'
    WHEN UPPER(status) = 'DISCARDED' THEN 'DENIED'
    WHEN UPPER(status) = 'ACTIVE' THEN 'VALIDATED'
    ELSE status
END
WHERE UPPER(status) IN ('PENDING', 'IN_PROGRESS', 'DISCARDED', 'ACTIVE');
