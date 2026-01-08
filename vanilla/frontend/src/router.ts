export class Router {
  private routes: Map<string, (params?: any) => void> = new Map();
  private notFoundHandler?: () => void;

  constructor() {
    // Listen to browser navigation
    window.addEventListener("popstate", () => this.resolve());
  }

  public init() {
    this.resolve();
  }

  public register(path: string, handler: (params?: any) => void) {
    if (path === "*") {
      this.notFoundHandler = handler;
    } else {
      this.routes.set(path, handler);
    }
  }

  public navigate(path: string, state?: any) {
    window.history.pushState(state, "", path);
    this.resolve();
  }

  private resolve() {
    const path = window.location.pathname;

    // Try exact match first
    const exactHandler = this.routes.get(path);
    if (exactHandler) {
      exactHandler();
      return;
    }

    // Try parameterized routes
    for (const [route, handler] of this.routes.entries()) {
      const params = this.matchRoute(route, path);
      if (params) {
        handler(params);
        return;
      }
    }

    // No match found, call 404 handler
    if (this.notFoundHandler) {
      this.notFoundHandler();
    }
  }

  private matchRoute(
    route: string,
    path: string,
  ): Record<string, string> | null {
    const routeParts = route.split("/").filter(Boolean);
    const pathParts = path.split("/").filter(Boolean);

    if (routeParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (!routePart || !pathPart) {
        return null;
      }

      if (routePart.startsWith(":")) {
        // This is a parameter
        const paramName = routePart.slice(1);
        params[paramName] = pathPart;
      } else if (routePart !== pathPart) {
        // Parts don't match
        return null;
      }
    }

    return params;
  }
}

export default Router;
