import type { User } from "../../../shared/types/auth.js";

class AuthService {
  private user: User | null = null;
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem("auth_token");
  }

  public async checkAuth(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.data;
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      this.clearAuth();
      return false;
    }
  }

  public async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.data.token;
        this.user = data.data.user;
        localStorage.setItem("auth_token", this.token!);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      this.clearAuth();
    }
  }

  public getUser(): User | null {
    return this.user;
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  public getToken(): string | null {
    return this.token;
  }

  public async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.data.token;
        this.user = data.data.user;
        localStorage.setItem("auth_token", this.token!);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem("auth_token");
  }
}

export const authService = new AuthService();
export default authService;
