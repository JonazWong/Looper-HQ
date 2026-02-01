import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type Logger = winston.Logger

/**
 * Create a Winston logger instance for migration scripts
 * @param name - Name of the logger/service
 * @returns Configured Winston logger
 */
export function createLogger(name: string): Logger {
  const logsDir = path.join(__dirname, '../../logs')
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { 
      service: name,
      migrationRun: timestamp
    },
    transports: [
      // Error logs
      new winston.transports.File({ 
        filename: path.join(logsDir, `error-${name}-${timestamp}.log`),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Combined logs
      new winston.transports.File({ 
        filename: path.join(logsDir, `${name}-${timestamp}.log`),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Console output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, service, timestamp }) => {
            return `${timestamp} [${service}] ${level}: ${message}`
          })
        )
      })
    ]
  })
}

/**
 * Save errors to a JSON file for later analysis
 */
export async function saveErrors(category: string, errors: any[]): Promise<string> {
  const fs = await import('fs/promises')
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const errorFile = path.join(__dirname, '../../logs', `errors-${category}-${timestamp}.json`)
  
  await fs.writeFile(errorFile, JSON.stringify(errors, null, 2), 'utf-8')
  
  return errorFile
}
