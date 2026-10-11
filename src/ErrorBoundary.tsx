import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('X-Kernel Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#020208',
          color: '#f1f5f9',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
          gap: '16px'
        }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-0.05em', color: '#6366f1' }}>X-KERNEL CRASH</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px' }}>
            {this.state.error?.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '12px',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            REBOOT KERNEL
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
