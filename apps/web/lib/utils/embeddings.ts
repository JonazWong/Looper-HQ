/**
 * Thin wrapper around generateEmbedding from @looper-hq/utils.
 *
 * Keeping this as an internal module (`@/lib/utils/embeddings`) rather than
 * importing directly from `@looper-hq/utils` in consuming modules lets test
 * files mock just this file without affecting the workspace package resolution
 * (which would break other tests that mock `openai` through the same package).
 */
export { generateEmbedding } from '@looper-hq/utils'
