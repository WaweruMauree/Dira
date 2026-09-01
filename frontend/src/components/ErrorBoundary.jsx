import { Component } from 'react'
import { Button } from '@/components/ui/button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
          <h2 className="font-heading text-xl text-ink mb-2">Something went wrong</h2>
          <p className="text-muted text-sm mb-4">Please refresh the page and try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      )
    }
    return this.props.children
  }
}
