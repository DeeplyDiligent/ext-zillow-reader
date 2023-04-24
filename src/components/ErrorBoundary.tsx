import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    errorInfo: Error | undefined
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorInfo: undefined
    };

    public static getDerivedStateFromError(err: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, errorInfo: err };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return <div>
                <h1>Sorry.. there was an error</h1>
                <h3>{this.state.errorInfo!.message}</h3>
            </div>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
