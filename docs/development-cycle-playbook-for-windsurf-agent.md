# Development Cycle Playbook for Windsurf Agent

This playbook provides guidelines for how the Windsurf AI agent should assist developers throughout the InnerFlame development cycle, particularly in maintaining documentation, planning features, and transitioning between development phases.

## Documentation Purpose and Structure

### Core Documentation Files

| Document | Purpose | Level of Detail | Update Frequency |
|----------|---------|-----------------|------------------|
| **project-requirements.md** | Defines core project vision and requirements | High-level, business-focused | Only when project scope changes |
| **user-stories.md** | User-centered feature descriptions | User perspective, acceptance criteria | When new features are conceptualized |
| **ui-flows.md** | Critical user journeys through the interface | Process flows, screen transitions | When UI patterns change |
| **roadmap.md** | Sequential implementation plan | Feature-level, implementation sequence | After each feature completion |
| **todo/feature-xxx.md** | Detailed implementation plan | Task-level, technical specifications | Throughout feature development |

## The Development Cycle

### 1. Feature Planning Phase

When a developer is ready to start a new feature, Windsurf should:

- **Review relevant documentation**
  - Identify applicable user stories
  - Reference relevant UI flows
  - Check where the feature fits in the roadmap

- **Create implementation todo list**
  - Generate a new `docs/todo/feature-xxx.md` file
  - Structure with clear sections:
    - Background (linking to relevant user stories)
    - Tasks (broken down by component/functionality)
    - Updates Log (to track progress)
  - Include status indicators (✅ Complete, 🚧 In Progress, 📝 Planned)
  - Base technical approach on established patterns in the monorepo

- **Provide technical guidance**
  - Reference the monorepo structure
  - Consider integration points between apps and packages
  - Identify reusable components from the UI library
  - Suggest appropriate state management approaches

### 2. Implementation Phase

During active development, Windsurf should:

- **Update the todo list**
  - Mark completed tasks as they're finished
  - Add implementation notes for future reference
  - Adjust remaining tasks based on discoveries
  - Record dated entries in the Updates Log

- **Preserve technical decisions**
  - Document important architecture decisions
  - Note any deviations from initial plans
  - Record performance considerations
  - Track dependencies and integration points

- **Maintain implementation consistency**
  - Ensure code follows established patterns
  - Maintain consistency with the UI component library
  - Follow type definitions from shared packages
  - Consider backend integration with Supabase

### 3. Feature Completion Phase

When a feature is complete, Windsurf should:

- **Update the roadmap**
  - Mark the feature as completed (✅)
  - Do NOT update dates or priorities
  - Focus on implementation sequence and dependencies
  - Include any added sub-features discovered during development

- **Document technology choices**
  - Add any new libraries or services used
  - Document integration methods between services
  - Note communication patterns (WebSockets, REST, etc.)
  - Update architecture diagrams if needed

- **Record lessons learned**
  - Document challenges encountered
  - Note successful patterns worth repeating
  - Identify potential optimizations for future work
  - Suggest improvements to the development process

- **Prepare for next feature**
  - Identify the next feature in the roadmap
  - Suggest preparation steps for the next feature
  - Highlight dependencies or prerequisites

## Documentation Guidelines

### Roadmap Documentation

The roadmap should:
- Present an optimal implementation sequence
- Focus on feature dependencies, not arbitrary deadlines
- Document high-level integration points between system components
- Use status indicators consistently (✅ 🚧 📝 ❌)
- Maintain a clear categorization by project phase

Example roadmap entry:
```markdown
## Phase 2: Core Features
- ✅ User authentication system
- 🚧 Document editor with real-time collaboration
  - Uses WebSockets for real-time updates
  - Integrates with Supabase for document storage
- 📝 AI document enhancement
```

### Feature Todo Documentation

Feature todos should:
- Break down implementation into logical components
- Provide technical guidance without being prescriptive
- Link to relevant user stories and UI flows
- Include clear acceptance criteria
- Track progress and decisions made during implementation

Example task entry:
```markdown
### 2. WebSocket Integration 🚧
- [x] Set up WebSocket connection class
- [x] Implement connection management (reconnection, heartbeat)
- [ ] Define message types and serialization
- [ ] Implement message handlers

**Notes:** Using shared types from @innerflame/shared-types package.
Connection management implemented with exponential backoff pattern.
```

### Technical Decisions

When documenting technical decisions:
- Focus on the "why" not just the "what"
- Note alternatives considered
- Document integration points between services
- Preserve context for future developers

Example:
```markdown
**Technical Note:** Chose WebSocket over REST for document updates
because it reduces latency and server load for real-time collaboration.
Considered SSE but WebSockets provided better bidirectional support.
```

## Best Practices for Windsurf

When assisting with the development cycle, Windsurf should:

1. **Be proactive in documentation maintenance**
   - Suggest updates to documentation when code changes
   - Flag inconsistencies between code and documentation
   - Remind developers to update progress in todo lists

2. **Maintain the appropriate level of detail**
   - Keep roadmap high-level and strategic
   - Make todo lists detailed and actionable
   - Ensure user stories remain user-focused, not implementation-focused

3. **Preserve institutional knowledge**
   - Document "why" decisions were made
   - Track challenges and solutions
   - Note performance considerations
   - Document integration patterns between services

4. **Support incremental development**
   - Help break down features into manageable tasks
   - Suggest logical stopping points
   - Identify verification steps
   - Help prioritize tasks for maximum learning

## Common Scenarios

### Starting a New Feature

```
Developer: "I want to start implementing the AI document enhancement feature."

Windsurf:
1. Identifies relevant user stories and roadmap items
2. Creates a new feature-ai-document-enhancement.md in the todo folder
3. Structures it with relevant tasks based on the architecture
4. Suggests first implementation steps
```

### Updating Progress

```
Developer: "I've completed the WebSocket connection management."

Windsurf:
1. Updates the feature todo list to mark tasks as complete
2. Adds an entry to the Updates Log with the date
3. Suggests next steps based on dependencies
4. Offers to create tests or documentation for the completed work
```

### Completing a Feature

```
Developer: "The AI document enhancement feature is now complete."

Windsurf:
1. Updates the roadmap to mark the feature as complete
2. Documents key technology choices in the todo list
3. Records lessons learned
4. Helps identify the next feature from the roadmap
5. Suggests creating a new feature todo list for the next feature
```

## Monorepo-Specific Guidance

Since InnerFlame uses a monorepo structure with multiple packages and apps, Windsurf should:

1. **Respect package boundaries**
   - Understand the purpose of each package:
     - `/apps/web` - Main React web application 
     - `/apps/ai-service` - AI service using WebSockets
     - `/packages/shared-types` - Common TypeScript interfaces
     - `/packages/ui-components` - Reusable UI components
     - `/packages/database` - Database access layer

2. **Promote code reuse**
   - Suggest using UI components from the shared library
   - Reference shared types for consistency
   - Utilize the database package for data access

3. **Maintain architectural integrity**
   - Keep frontend code in the web app
   - Keep AI processing in the AI service
   - Use shared packages for cross-cutting concerns

---

This playbook serves as a reference for how Windsurf should assist developers throughout the development cycle, focusing on documentation maintenance, feature planning, and knowledge preservation.

*Last updated: March 12, 2025*
