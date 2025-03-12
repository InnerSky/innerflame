# Database Package

This package provides a unified data access layer for InnerFlame applications.

## Purpose
- Abstract database operations behind a clean API
- Implement consistent data access patterns
- Handle database connections and transactions
- Provide repository implementations for all entities

## Features
- Supabase client configuration and management
- Repository pattern implementation
- Data validation and transformation
- Transaction handling

## Usage
Repositories can be imported and used directly:

```typescript
import { EntityRepository } from '@innerflame/database';

const repo = new EntityRepository();
const entity = await repo.findById('entity-id');
```
