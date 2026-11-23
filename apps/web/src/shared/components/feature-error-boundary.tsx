import { Component, type ReactNode } from "react";
import { Button } from "./button";

type Props = { children: ReactNode; message: string };
type State = { hasError: boolean };

export class FeatureErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section>
        <p role="alert">{this.props.message}</p>
        <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
      </section>
    );
  }
}
