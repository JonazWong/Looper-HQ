const REQUIRED_SERVER_VARS = ['AIRWALLEX_CLIENT_ID', 'AIRWALLEX_API_KEY'] as const

function isPlaceholder(value?: string) {
  if (!value) return true
  const normalized = value.trim().toLowerCase()
  return (
    normalized === '' ||
    normalized.includes('your-airwallex-client-id') ||
    normalized.includes('your-airwallex-api-key') ||
    normalized.includes('your-airwallex-webhook-secret')
  )
}

function main() {
  const env = process.env.AIRWALLEX_ENV ?? 'demo'
  const publicEnv = process.env.NEXT_PUBLIC_AIRWALLEX_ENV ?? 'demo'

  let hasError = false

  if (!['demo', 'prod', 'staging'].includes(env)) {
    console.error(`Invalid AIRWALLEX_ENV: ${env}. Expected demo|prod|staging`)
    hasError = true
  }

  for (const key of REQUIRED_SERVER_VARS) {
    const value = process.env[key]
    if (isPlaceholder(value)) {
      console.error(`Missing or placeholder: ${key}`)
      hasError = true
    }
  }

  if (env !== publicEnv) {
    console.warn(`Environment mismatch: AIRWALLEX_ENV=${env}, NEXT_PUBLIC_AIRWALLEX_ENV=${publicEnv}`)
    console.warn('Recommended: keep both in sync to avoid frontend/backend environment mismatch.')
  }

  if (hasError) {
    process.exit(1)
  }

  console.log('Airwallex configuration check passed.')
  console.log(`  AIRWALLEX_ENV=${env}`)
  console.log(`  NEXT_PUBLIC_AIRWALLEX_ENV=${publicEnv}`)
}

main()
