import { ReactNode } from 'react'

// Root layout delegates html/body to locale layout
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
