/* eslint-disable react/require-render-return */
/**
 * Form Component
 */

import { Component } from '../base/Component';
import { createElement } from '../../utils/dom';
import { validateForm, ValidationRule } from '../../utils/validation';

export interface FormField {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: { value: string; label: string }[];
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
}

interface FormState {
  values: Record<string, any>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  loading: boolean;
}

export class Form extends Component<FormProps, FormState> {
  private formElement: HTMLFormElement | null = null;

  constructor(props: FormProps) {
    super(props, {
      values: {},
      errors: {},
      touched: {},
      loading: props.loading || false,
    });

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  protected createElement(): HTMLElement {
    return createElement('div', {
      className: this.getClassName(),
    });
  }

  protected getClassName(): string {
    return 'form-wrapper';
  }

  protected render(): void {
    this.element.innerHTML = '';

    this.formElement = createElement('form', {
      className: 'form',
      events: {
        submit: this.handleSubmit,
      },
    }) as HTMLFormElement;

    this.props.fields.forEach((field) => {
      const fieldEl = this.createField(field);
      this.formElement!.appendChild(fieldEl);
    });

    const actions = this.createActions();
    this.formElement.appendChild(actions);

    this.element.appendChild(this.formElement);
  }

  private createField(field: FormField): HTMLElement {
    const fieldWrapper = createElement('div', {
      className: 'form-field',
    });

    if (field.label) {
      const label = createElement('label', {
        className: 'form-label',
        textContent: field.label,
        attributes: {
          for: field.name,
        },
      });

      if (field.required) {
        const required = createElement('span', {
          className: 'form-required',
          textContent: ' *',
        });
        label.appendChild(required);
      }

      fieldWrapper.appendChild(label);
    }

    let input: HTMLElement;

    if (field.type === 'textarea') {
      input = createElement('textarea', {
        className: 'form-input',
        attributes: {
          name: field.name,
          id: field.name,
          placeholder: field.placeholder || '',
          ...(field.required && { required: 'true' }),
        },
        events: {
          input: (e) => this.handleInputChange(field.name, (e.target as HTMLTextAreaElement).value),
          blur: () => this.handleBlur(field.name),
        },
      });
    } else if (field.type === 'select' && field.options) {
      input = createElement('select', {
        className: 'form-input form-select',
        attributes: {
          name: field.name,
          id: field.name,
          ...(field.required && { required: 'true' }),
        },
        events: {
          change: (e) => this.handleInputChange(field.name, (e.target as HTMLSelectElement).value),
          blur: () => this.handleBlur(field.name),
        },
      });

      const placeholder = createElement('option', {
        textContent: field.placeholder || 'Select...',
        attributes: { value: '', disabled: 'true', selected: 'true' },
      });
      input.appendChild(placeholder);

      field.options.forEach((option) => {
        const optionEl = createElement('option', {
          textContent: option.label,
          attributes: { value: option.value },
        });
        input.appendChild(optionEl);
      });
    } else {
      input = createElement('input', {
        className: 'form-input',
        attributes: {
          type: field.type || 'text',
          name: field.name,
          id: field.name,
          placeholder: field.placeholder || '',
          ...(field.required && { required: 'true' }),
        },
        events: {
          input: (e) => this.handleInputChange(field.name, (e.target as HTMLInputElement).value),
          blur: () => this.handleBlur(field.name),
        },
      });
    }

    fieldWrapper.appendChild(input);

    const errors = this.state.errors[field.name];
    if (errors && errors.length > 0 && this.state.touched[field.name]) {
      errors.forEach((error) => {
        const errorEl = createElement('div', {
          className: 'form-error',
          textContent: error,
        });
        fieldWrapper.appendChild(errorEl);
      });
    }

    return fieldWrapper;
  }

  private createActions(): HTMLElement {
    const actions = createElement('div', {
      className: 'form-actions',
    });

    if (this.props.onCancel) {
      const cancelBtn = createElement('button', {
        className: 'btn btn-secondary',
        textContent: this.props.cancelLabel || 'Cancel',
        attributes: { type: 'button' },
        events: {
          click: this.props.onCancel,
        },
      });
      actions.appendChild(cancelBtn);
    }

    const submitBtn = createElement('button', {
      className: 'btn btn-primary',
      textContent: this.props.submitLabel || 'Submit',
      attributes: {
        type: 'submit',
        ...(this.state.loading && { disabled: 'true' }),
      },
    });

    if (this.state.loading) {
      submitBtn.innerHTML = '<span class="spinner"></span> Loading...';
    }

    actions.appendChild(submitBtn);

    return actions;
  }

  private handleInputChange(name: string, value: any): void {
    this.setState({
      values: { ...this.state.values, [name]: value },
    });
  }

  private handleBlur(name: string): void {
    this.setState({
      touched: { ...this.state.touched, [name]: true },
    });

    this.validateField(name);
  }

  private validateField(name: string): void {
    const field = this.props.fields.find((f) => f.name === name);
    if (!field || !field.validation) return;

    const value = this.state.values[name];
    const errors: string[] = [];

    field.validation.forEach((rule) => {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    });

    this.setState({
      errors: { ...this.state.errors, [name]: errors },
    });
  }

  private validateAllFields(): boolean {
    const validationRules: Record<string, ValidationRule[]> = {};

    this.props.fields.forEach((field) => {
      if (field.validation) {
        validationRules[field.name] = field.validation;
      }
    });

    const errors = validateForm(this.state.values, validationRules);
    this.setState({ errors });

    return Object.keys(errors).length === 0;
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();

    const allTouched = this.props.fields.reduce((acc, field) => {
      acc[field.name] = true;
      return acc;
    }, {} as Record<string, boolean>);

    this.setState({ touched: allTouched });

    if (this.validateAllFields()) {
      this.props.onSubmit(this.state.values);
    }
  }

  public setValues(values: Record<string, any>): void {
    this.setState({ values });
  }

  public getValues(): Record<string, any> {
    return this.state.values;
  }

  public setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  public reset(): void {
    this.setState({
      values: {},
      errors: {},
      touched: {},
    });

    if (this.formElement) {
      this.formElement.reset();
    }
  }
}

export default Form;
