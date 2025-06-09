import React from 'react'
import { render, screen } from '@testing-library/react'
import { Example } from './Example'

describe('Example Component', () => {
  it('renders hello world', () => {
    render(<Example />)
    const heading = screen.getByText(/hello world/i)
    expect(heading).toBeInTheDocument()
  })
})
