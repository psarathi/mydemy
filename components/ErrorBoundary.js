import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo,
        });

        // You can also log the error to an error reporting service here
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div style={{
                    padding: '40px',
                    maxWidth: '600px',
                    margin: '0 auto',
                    textAlign: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                    <h1 style={{
                        fontSize: '2rem',
                        marginBottom: '1rem',
                        color: '#dc2626',
                    }}>
                        Something went wrong
                    </h1>

                    <p style={{
                        fontSize: '1rem',
                        marginBottom: '2rem',
                        color: '#6b7280',
                    }}>
                        We apologize for the inconvenience. An error occurred while loading this page.
                    </p>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            marginBottom: '2rem',
                            padding: '1rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px',
                            textAlign: 'left',
                            fontSize: '0.875rem',
                        }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem',
                                color: '#374151',
                            }}>
                                Error details (development only)
                            </summary>
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '4px',
                                overflow: 'auto',
                            }}>
                                <strong style={{ color: '#dc2626' }}>
                                    {this.state.error.toString()}
                                </strong>
                                <pre style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}>
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </div>
                        </details>
                    )}

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                    }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                        >
                            Try Again
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
