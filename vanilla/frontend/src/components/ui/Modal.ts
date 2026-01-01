/**
 * Modal Component
 */

import { Component } from '../base/Component';
import { createElement } from '../../utils/dom';

export interface ModalProps {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children?: HTMLElement[];
  footer?: HTMLElement[];
  onClose?: () => void;
}

interface ModalState {
  isOpen: boolean;
}

export class Modal extends Component<ModalProps, ModalState> {
  private overlay: HTMLElement | null = null;
  private modalContent: HTMLElement | null = null;

  constructor(props: ModalProps) {
    super(props, {
      isOpen: false,
    });

    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.close = this.close.bind(this);
  }

  protected createElement(): HTMLElement {
    return createElement('div', {
      className: 'modal-container',
    });
  }

  protected getClassName(): string {
    const classes = ['modal-container'];

    if (this.state.isOpen) {
      classes.push('modal-open');
    }

    return classes.join(' ');
  }

  protected render(): void {
    this.element.innerHTML = '';
    this.element.className = this.getClassName();

    if (!this.state.isOpen) {
      return;
    }

    // Create overlay
    this.overlay = createElement('div', {
      className: 'modal-overlay',
      events: {
        click: this.handleOverlayClick,
      },
    });

    this.element.appendChild(this.overlay);

    // Create modal
    const size = this.props.size || 'md';
    const modal = createElement('div', {
      className: `modal modal-${size}`,
      events: {
        click: (e) => e.stopPropagation(),
      },
    });

    // Header
    if (this.props.title || this.props.showCloseButton !== false) {
      const header = this.createHeader();
      modal.appendChild(header);
    }

    // Body
    const body = createElement('div', {
      className: 'modal-body',
    });

    if (this.props.children) {
      this.props.children.forEach((child) => {
        body.appendChild(child);
      });
    }

    modal.appendChild(body);

    // Footer
    if (this.props.footer && this.props.footer.length > 0) {
      const footer = createElement('div', {
        className: 'modal-footer',
      });

      this.props.footer.forEach((child) => {
        footer.appendChild(child);
      });

      modal.appendChild(footer);
    }

    this.modalContent = modal;
    this.overlay.appendChild(modal);
  }

  private createHeader(): HTMLElement {
    const header = createElement('div', {
      className: 'modal-header',
    });

    if (this.props.title) {
      const title = createElement('h2', {
        className: 'modal-title',
        textContent: this.props.title,
      });
      header.appendChild(title);
    }

    if (this.props.showCloseButton !== false) {
      const closeButton = createElement('button', {
        className: 'modal-close',
        innerHTML: '&times;',
        attributes: {
          'aria-label': 'Close',
        },
        events: {
          click: this.close,
        },
      });
      header.appendChild(closeButton);
    }

    return header;
  }

  private handleOverlayClick(e: Event): void {
    if (this.props.closeOnOverlay !== false) {
      this.close();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.props.closeOnEscape !== false) {
      this.close();
    }
  }

  protected onMount(): void {
    if (this.props.closeOnEscape !== false) {
      document.addEventListener('keydown', this.handleKeyDown);
    }
  }

  protected onUnmount(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.disableBodyScroll(false);
  }

  public open(): void {
    this.setState({ isOpen: true });
    this.disableBodyScroll(true);
  }

  public close(): void {
    this.setState({ isOpen: false });
    this.disableBodyScroll(false);

    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  public toggle(): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public isOpen(): boolean {
    return this.state.isOpen;
  }

  private disableBodyScroll(disable: boolean): void {
    if (disable) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  public setContent(children: HTMLElement[]): void {
    this.props.children = children;
    this.update();
  }

  public setFooter(footer: HTMLElement[]): void {
    this.props.footer = footer;
    this.update();
  }
}

export default Modal;
