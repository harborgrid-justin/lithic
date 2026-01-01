/* eslint-disable react/require-render-return */
/**
 * Register Page Component
 */

import { Component } from "../components/base/Component";
import { createElement } from "../utils/dom";
import { Card } from "../components/ui/Card";
import { Form, FormField } from "../components/ui/Form";
import { toast } from "../components/ui/Toast";
import { authService as auth } from "../services/auth";
import { validationRules } from "../utils/validation";

export interface RegisterPageProps {
  onRegisterSuccess?: () => void;
  onLoginClick?: () => void;
}

interface RegisterPageState {
  loading: boolean;
}

export class RegisterPage extends Component<
  RegisterPageProps,
  RegisterPageState
> {
  private form: Form | null = null;

  constructor(props: RegisterPageProps) {
    super(props, {
      loading: false,
    });

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  protected getClassName(): string {
    return "register-page";
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();
    this.removeAllChildren();

    const container = createElement("div", {
      className: "register-container",
    });

    const card = new Card({
      title: "Create Account",
      subtitle: "Register for Lithic Healthcare",
      className: "register-card",
      shadow: true,
    });

    const cardContent = this.createCardContent();
    card.setContent([cardContent]);

    this.addChild(card, container);
    this.element.appendChild(container);
  }

  private createCardContent(): HTMLElement {
    const content = createElement("div", {
      className: "register-content",
    });

    const fields: FormField[] = [
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "Enter your first name",
        required: true,
        validation: [
          validationRules.required("First name is required"),
          validationRules.minLength(
            2,
            "First name must be at least 2 characters",
          ),
        ],
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Enter your last name",
        required: true,
        validation: [
          validationRules.required("Last name is required"),
          validationRules.minLength(
            2,
            "Last name must be at least 2 characters",
          ),
        ],
      },
      {
        name: "email",
        label: "Email Address",
        type: "email",
        placeholder: "Enter your email",
        required: true,
        validation: [
          validationRules.required("Email is required"),
          validationRules.email("Invalid email address"),
        ],
      },
      {
        name: "phone",
        label: "Phone Number",
        type: "tel",
        placeholder: "(555) 123-4567",
        validation: [validationRules.phoneNumber("Invalid phone number")],
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Create a strong password",
        required: true,
        validation: [
          validationRules.required("Password is required"),
          validationRules.minLength(
            12,
            "Password must be at least 12 characters",
          ),
          validationRules.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
            "Password must contain uppercase, lowercase, number, and special character",
          ),
        ],
      },
      {
        name: "confirmPassword",
        label: "Confirm Password",
        type: "password",
        placeholder: "Re-enter your password",
        required: true,
        validation: [
          validationRules.required("Please confirm your password"),
          validationRules.custom((value) => {
            const password = this.form?.getValues().password;
            return value === password;
          }, "Passwords do not match"),
        ],
      },
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { value: "patient", label: "Patient" },
          { value: "doctor", label: "Doctor" },
          { value: "nurse", label: "Nurse" },
          { value: "staff", label: "Staff" },
        ],
        validation: [validationRules.required("Please select a role")],
      },
    ];

    this.form = new Form({
      fields,
      onSubmit: this.handleSubmit,
      submitLabel: "Create Account",
      loading: this.state.loading,
    });

    this.addChild(this.form, content);

    // Login link
    const loginSection = createElement("div", {
      className: "register-login",
    });

    const loginText = createElement("span", {
      textContent: "Already have an account? ",
    });

    const loginLink = createElement("a", {
      className: "register-login-link",
      textContent: "Sign in",
      attributes: { href: "#" },
      events: {
        click: (e) => {
          e.preventDefault();
          this.props.onLoginClick?.();
        },
      },
    });

    loginSection.appendChild(loginText);
    loginSection.appendChild(loginLink);
    content.appendChild(loginSection);

    return content;
  }

  private async handleSubmit(data: Record<string, any>): Promise<void> {
    this.setState({ loading: true });
    this.form?.setLoading(true);

    try {
      await auth.register(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
      );

      toast.success("Registration successful! Welcome to Lithic Healthcare.");

      if (this.props.onRegisterSuccess) {
        this.props.onRegisterSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      this.setState({ loading: false });
      this.form?.setLoading(false);
    }
  }
}

export default RegisterPage;
