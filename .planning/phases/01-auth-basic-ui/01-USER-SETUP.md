# Phase 1: User Setup Required

**Generated:** 2025-01-30
**Phase:** 01-auth-basic-ui
**Status:** Incomplete

## Overview

This phase introduced avatar upload functionality that requires Supabase Storage configuration.

## Dashboard Configuration

### Supabase Storage Bucket

- [ ] **Create 'avatars' bucket with public access**
  - Location: Supabase Dashboard -> Storage -> New bucket
  - Name: `avatars`
  - Public bucket: ON (to serve avatar URLs publicly)

- [ ] **Add RLS policy for authenticated uploads**
  - Location: Supabase Dashboard -> Storage -> avatars -> Policies
  - Create policy: "Allow authenticated users to upload"
  - Policy type: INSERT
  - Target roles: authenticated
  - Policy definition:
    ```sql
    (auth.uid() IS NOT NULL)
    ```

- [ ] **Add RLS policy for authenticated updates**
  - Location: Supabase Dashboard -> Storage -> avatars -> Policies
  - Create policy: "Allow users to update own avatars"
  - Policy type: UPDATE
  - Target roles: authenticated
  - Policy definition:
    ```sql
    (auth.uid()::text = (storage.foldername(name))[1])
    ```

- [ ] **Add RLS policy for public reads**
  - Location: Supabase Dashboard -> Storage -> avatars -> Policies
  - Create policy: "Allow public read access"
  - Policy type: SELECT
  - Target roles: public
  - Policy definition:
    ```sql
    true
    ```

## Verification

After completing setup, verify:

```bash
# 1. Check if avatars bucket exists
# Go to Supabase Dashboard -> Storage
# Verify 'avatars' bucket is listed

# 2. Test avatar upload
# - Login to app
# - Go to /profile
# - Try uploading an avatar image
# - Image should upload and display correctly
```

## Notes

- Avatar files are stored with pattern: `{user_id}-{timestamp}.{ext}`
- Public bucket allows serving avatar URLs without authentication
- RLS policies ensure users can only upload/update their own avatars

---
**Once all items complete:** Mark status as "Complete"
