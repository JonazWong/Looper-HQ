import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  it('should render badge with text', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('should have default badge styles', () => {
    const { container } = render(<Badge>Default</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('inline-flex')
    expect(badge).toHaveClass('items-center')
    expect(badge).toHaveClass('rounded-full')
    expect(badge).toHaveClass('border')
    expect(badge).toHaveClass('px-2.5')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('font-semibold')
  })

  it('should render default variant', () => {
    const { container } = render(<Badge>Default</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-primary')
    expect(badge).toHaveClass('text-primary-foreground')
  })

  it('should render secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-secondary')
    expect(badge).toHaveClass('text-secondary-foreground')
  })

  it('should render destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-destructive')
    expect(badge).toHaveClass('text-destructive-foreground')
  })

  it('should render outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('text-foreground')
  })

  it('should accept custom className', () => {
    const { container } = render(
      <Badge className="custom-badge">Custom</Badge>
    )
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('custom-badge')
  })

  it('should forward HTML attributes', () => {
    const { container } = render(
      <Badge data-testid="status-badge">Active</Badge>
    )
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveAttribute('data-testid', 'status-badge')
  })

  it('should render with different content types', () => {
    const { rerender } = render(<Badge>Text</Badge>)
    expect(screen.getByText('Text')).toBeInTheDocument()

    rerender(
      <Badge>
        <span>✓</span> Completed
      </Badge>
    )
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should support click events', () => {
    let clicked = false
    const { container } = render(
      <Badge onClick={() => { clicked = true }}>Clickable</Badge>
    )
    const badge = container.firstChild as HTMLElement
    badge.click()
    expect(clicked).toBe(true)
  })
})
