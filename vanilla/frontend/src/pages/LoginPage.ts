/* eslint-disable react/require-render-return */
/**
 * Login Page Component
 */

import { Component } from '../components/base/Component';
import { createElement } from '../utils/dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { authService as auth } from '../services/auth';
import { isValidEmail } from '../utils/validation';

export interface LoginPageProps {
  onLoginSuccess?: () => void;
  onRegisterClick?: () => void;
}

interface LoginPageState {
  email: string;
  password: string;
  loading: boolean;
  errors: {
    email?: string;
    password?: string;
  };
}

export class LoginPage extends Component<LoginPageProps, LoginPageState> {
  private emailInput: Input | null = null;
  private passwordInput: Input | null = null;
  private submitButton: Button | null = null;

  constructor(props: LoginPageProps) {
    super(props, {
      email: '',
      password: '',
      loading: false,
      errors: {},
    });

    this.handleLogin = this.handleLogin.bind(this);
  }

  protected getClassName(): string {
    return 'login-page';
  }

  protected render(): void {
    this.element.innerHTML = '';
    this.element.className = this.getClassName();
    this.removeAllChildren();

    const container = createElement('div', {
      className: 'login-container',
    });

    const card = new Card({
      title: 'Login to Lithic Healthcare',
      subtitle: 'Enter your credentials to access your account',
      className: 'login-card',
      shadow: true,
    });

    const cardContent = this.createCardContent();
    card.setContent([cardContent]);

    this.addChild(card, container);
    this.element.appendChild(container);
  }

  private createCardContent(): HTMLElement {
    const content = createElement('div', {
      className: 'login-form',
    });

    // Email input
    this.emailInput = new Input({
      type: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      required: true,
      icon: '📧',
      error: this.state.errors.email,
      onChange: (value) => this.handleEmailChange(value),
    });

    const emailContainer = createElement('div', { className: 'form-group' });
    this.addChild(this.emailInput, emailContainer);
    content.appendChild(emailContainer);

    // Password input
    this.passwordInput = new Input({
      type: 'password',
      label: 'Password',
      placeholder: 'Enter your password',
      required: true,
      icon: '🔒',
      error: this.state.errors.password,
      onChange: (value) => this.handlePasswordChange(value),
    });

    const passwordContainer = createElement('div', { className: 'form-group' });
    this.addChild(this.passwordInput, passwordContainer);
    content.appendChild(passwordContainer);

    // Forgot password link
    const forgotPassword = createElement('div', {
      className: 'login-forgot',
    });

    const forgotLink = createElement('a', {
      className: 'login-forgot-link',
      textContent: 'Forgot password?',
      attributes: { href: '#' },
      events: {
        click: (e) => {
          e.preventDefault();
          toast.info('Password reset feature coming soon!');
        },
      },
    });

    forgotPassword.appendChild(forgotLink);
    content.appendChild(forgotPassword);

    // Submit button
    this.submitButton = new Button({
      label: 'Sign In',
      variant: 'primary',
      fullWidth: true,
      loading: this.state.loading,
      onClick: this.handleLogin,
    });

    const buttonContainer = createElement('div', { className: 'form-group' });
    this.addChild(this.submitButton, buttonContainer);
    content.appendChild(buttonContainer);

    // Register link
    const registerSection = createElement('div', {
      className: 'login-register',
    });

    const registerText = createElement('span', {
      textContent: "Don't have an account? ",
    });

    const registerLink = createElement('a', {
      className: 'login-register-link',
      textContent: 'Sign up',
      attributes: { href: '#' },
      events: {
        click: (e) => {
          e.preventDefault();
          this.props.onRegisterClick?.();
        },
      },
    });

    registerSection.appendChild(registerText);
    registerSection.appendChild(registerLink);
    content.appendChild(registerSection);

    return content;
  }

  private handleEmailChange(value: string): void {
    this.setState({ email: value });

    if (this.state.errors.email) {
      this.validateEmail(value);
    }
  }

  private handlePasswordChange(value: string): void {
    this.setState({ password: value });

    if (this.state.errors.password) {
      this.validatePassword(value);
    }
  }

  private validateEmail(email: string): boolean {
    if (!email) {
      this.setState({
        errors: { ...this.state.errors, email: 'Email is required' },
      });
      this.emailInput?.setError('Email is required');
      return false;
    }

    if (!isValidEmail(email)) {
      this.setState({
        errors: { ...this.state.errors, email: 'Invalid email address' },
      });
      this.emailInput?.setError('Invalid email address');
      return false;
    }

    this.setState({
      errors: { ...this.state.errors, email: undefined },
    });
    this.emailInput?.setError(null);
    return true;
  }

  private validatePassword(password: string): boolean {
    if (!password) {
      this.setState({
        errors: { ...this.state.errors, password: 'Password is required' },
      });
      this.passwordInput?.setError('Password is required');
      return false;
    }

    this.setState({
      errors: { ...this.state.errors, password: undefined },
    });
    this.passwordInput?.setError(null);
    return true;
  }

  private async handleLogin(): Promise<void> {
    const isEmailValid = this.validateEmail(this.state.email);
    const isPasswordValid = this.validatePassword(this.state.password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    this.setState({ loading: true });
    this.submitButton?.setLoading(true);

    try {
      await auth.login(this.state.email, this.state.password);

      toast.success('Login successful!');

      if (this.props.onLoginSuccess) {
        this.props.onLoginSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      this.setState({ loading: false });
      this.submitButton?.setLoading(false);
    }
  }
}

export default LoginPage;
