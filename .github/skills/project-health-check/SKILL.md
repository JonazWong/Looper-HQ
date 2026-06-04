---
name: project-health-check
description: '**WORKFLOW SKILL** — Comprehensive project health check: scans all pages, functions, and relations; performs item-by-item checks; auto-repairs issues; runs tests to ensure correct operation. Use for: full project validation, automated repair, testing all components. Keywords: check pages, functions, relations, auto-repair, test, ensure correct operation, 檢查專案, 自動修復, 測試.'
---

# Project Health Check Skill

## Overview
This skill performs a comprehensive health check on the entire Looper HQ project, scanning all pages, functions, and relations. It conducts item-by-item checks, automatically repairs identified issues, and runs tests to ensure everything operates correctly.

## When to Use
- After major changes or deployments
- Before production releases
- When troubleshooting project-wide issues
- For automated quality assurance

## Workflow Steps

### 1. Codebase Exploration
- Use the Explore subagent to scan all source files
- Identify pages, components, API routes, and database relations
- Map out function dependencies and relations

### 2. Item-by-Item Checks
- Validate each page for rendering issues
- Check API routes for proper authentication and error handling
- Verify database relations and constraints
- Test component interactions and data flow

### 3. Automatic Repairs
- Fix common issues like missing imports, type errors, or configuration problems
- Update deprecated code patterns
- Correct database schema inconsistencies

### 4. Testing
- Run unit tests, integration tests, and end-to-end tests
- Validate build processes
- Check linting and type checking

### 5. Validation
- Ensure all components work together correctly
- Verify data consistency across the application
- Confirm deployment readiness

## Implementation
This skill uses multiple tools and subagents:
- **Explore subagent**: For codebase analysis
- **run_in_terminal**: For running tests and builds
- **get_errors**: For checking compilation issues
- **replace_string_in_file**: For auto-repairs
- **dbclient-execute-query**: For database validation

## Output
Provides a detailed report of:
- Issues found and fixed
- Test results
- Recommendations for manual fixes if needed
- Overall project health score