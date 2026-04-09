'use client'

import { Component, ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Something went wrong.',
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: 16,
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
            }}
          >
            <strong>Error:</strong> {this.state.message}
          </div>
        )
      )
    }

    return this.props.children
  }
}
