import { Component, ReactNode } from 'react';

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

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
          <div style={{
            maxWidth: '500px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '50px 40px',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            color: '#333',
          }}>
            <h1 style={{ fontSize: '64px', margin: '0 0 20px 0' }}>🛸</h1>
            <h2 style={{
              fontSize: '32px',
              margin: '0 0 15px 0',
              fontWeight: '700',
              color: '#333',
            }}>
              Oops! Pi's spaceship had a hiccup!
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#666',
              margin: '0 0 30px 0',
              lineHeight: '1.6',
            }}>
              Don't worry, it happens sometimes. Let's get you back to learning!
            </p>
            <button
              onClick={this.handleReset}
              style={{
                fontSize: '20px',
                padding: '16px 48px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
