# Phase 1: Native Supabase Anonymous Authentication Implementation

## Preparation

- [x] Enable Anonymous Authentication in Supabase Dashboard (Authentication > Providers > Anonymous Sign-in)
- [x] Verify Supabase client version supports anonymous auth (v2.0.0+)
- [x] **IMPORTANT**: Run database migrations for anonymous auth support
  - [x] Check database schema for proper auth.users table configuration
  - [x] Ensure auth.identities table is properly configured
  - [x] Run SQL query to verify anonymous users can be created:
    ```sql
    -- Verify schema has proper anonymous auth support
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name LIKE '%meta%';
    ```

## Core Implementation

### 1. Anonymous Auth Service

- [x] Refactor `anonymousAuthService.ts` to use native methods:
  ```typescript
  // Key method implementation
  async getOrCreateAnonymousUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    return data.user;
  }
  
  isAnonymousUser(user: User | null): boolean {
    return !!user?.app_metadata?.is_anonymous;
  }
  ```

### 2. AuthContext Updates

- [x] Update anonymous user detection in `AuthContext.tsx`:
  ```typescript
  // In onAuthStateChange and loadUser functions
  setIsAnonymous(!!session?.user?.app_metadata?.is_anonymous);
  ```

- [x] Refactor Google linking for anonymous users:
  ```typescript
  // When linking anonymous users to Google accounts
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  ```

### 3. Email/Password Conversion

- [ ] Implement anonymous to email/password conversion:
  ```typescript
  // Step 1: Update with email (sends verification)
  const { error } = await supabase.auth.updateUser({ email });
  
  // Step 2: After verification, set password
  const { error } = await supabase.auth.updateUser({ password });
  ```

### 4. Cleanup Implementation

- [ ] Create a basic SQL cleanup function:
  ```sql
  -- Run periodically to clean up expired anonymous users
  delete from auth.users
  where raw_app_meta_data->>'is_anonymous' = 'true'
  and created_at < now() - interval '30 days';
  ```

## Troubleshooting

- [x] Fix "Database error creating anonymous user" issue
  - [x] Verify the Supabase project has the latest migrations applied
  - [x] Check if anonymous auth is fully enabled on the server-side
  - [x] Ensure the database has the correct schema and tables
  - [ ] If needed, create a Supabase edge function to debug authentication configuration

## Testing

- [ ] Test anonymous user creation
  - [ ] Verify JWT contains `is_anonymous` claim
  - [ ] Confirm user persistence between page reloads

- [ ] Test OAuth linking flow
  - [ ] Anonymous user can link with Google
  - [ ] User data is preserved after linking

- [ ] Test Email/Password conversion
  - [ ] Email verification process works
  - [ ] Password can be set after verification
  - [ ] User data is preserved after conversion

## Implementation Order

1. ✅ Enable anonymous auth in Supabase Dashboard
2. ✅ Update anonymousAuthService.ts with native methods
3. ✅ Modify AuthContext.tsx to detect anonymous users correctly
4. ✅ Implement OAuth linking (Google integration)
5. ✅ Fix database configuration issues for anonymous auth
6. [ ] Implement email/password conversion flow
7. [ ] Add basic cleanup mechanism
8. [ ] Test all flows thoroughly
