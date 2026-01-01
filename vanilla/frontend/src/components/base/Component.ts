/**
 * Base Component Class for Vanilla TypeScript
 * Provides a component-based architecture similar to modern frameworks
 */

import { createElement } from '../../utils/dom';

export interface ComponentOptions {
  className?: string | string[];
  id?: string;
  attributes?: Record<string, string>;
  dataset?: Record<string, string>;
}

export abstract class Component<P = any, S = any> {
  protected element: HTMLElement;
  protected props: P;
  protected state: S;
  protected children: Component[] = [];
  protected mounted: boolean = false;

  constructor(props: P, initialState: S) {
    this.props = props;
    this.state = initialState;
    this.element = this.createElement();
  }

  /**
   * Create the component's root element
   * Override in subclass to customize
   */
  protected createElement(): HTMLElement {
    return createElement('div', {
      className: this.getClassName(),
    });
  }

  /**
   * Get component class name
   * Override in subclass
   */
  protected getClassName(): string {
    return 'component';
  }

  /**
   * Render the component
   * Must be implemented by subclass
   */
  protected abstract render(): void;

  /**
   * Lifecycle: Called after component is mounted to DOM
   */
  protected onMount(): void {
    // Override in subclass if needed
  }

  /**
   * Lifecycle: Called before component is unmounted from DOM
   */
  protected onUnmount(): void {
    // Override in subclass if needed
  }

  /**
   * Lifecycle: Called when props are updated
   */
  protected onPropsUpdate(prevProps: P): void {
    // Override in subclass if needed
  }

  /**
   * Lifecycle: Called when state is updated
   */
  protected onStateUpdate(prevState: S): void {
    // Override in subclass if needed
  }

  /**
   * Update component props
   */
  public setProps(newProps: Partial<P>): void {
    const prevProps = { ...this.props };
    this.props = { ...this.props, ...newProps };
    this.onPropsUpdate(prevProps);
    this.update();
  }

  /**
   * Update component state
   */
  protected setState(newState: Partial<S>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateUpdate(prevState);
    this.update();
  }

  /**
   * Force component update (re-render)
   */
  protected update(): void {
    if (this.mounted) {
      this.render();
    }
  }

  /**
   * Mount component to parent element
   */
  public mount(parent: HTMLElement): void {
    this.render();
    parent.appendChild(this.element);
    this.mounted = true;
    this.onMount();
  }

  /**
   * Unmount component from DOM
   */
  public unmount(): void {
    this.onUnmount();
    this.children.forEach((child) => child.unmount());
    this.children = [];

    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.mounted = false;
  }

  /**
   * Get the root DOM element
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Add event listener to root element
   */
  protected addEventListener(
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    this.element.addEventListener(event, handler, options);
  }

  /**
   * Remove event listener from root element
   */
  protected removeEventListener(
    event: string,
    handler: EventListener,
    options?: EventListenerOptions
  ): void {
    this.element.removeEventListener(event, handler, options);
  }

  /**
   * Emit custom event
   */
  protected emit(eventName: string, detail?: any): void {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Query selector within component
   */
  protected querySelector<T extends HTMLElement>(selector: string): T | null {
    return this.element.querySelector<T>(selector);
  }

  /**
   * Query all selectors within component
   */
  protected querySelectorAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(this.element.querySelectorAll<T>(selector));
  }

  /**
   * Add child component
   */
  protected addChild(child: Component, container?: HTMLElement): void {
    this.children.push(child);
    child.mount(container || this.element);
  }

  /**
   * Remove child component
   */
  protected removeChild(child: Component): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.unmount();
    }
  }

  /**
   * Remove all child components
   */
  protected removeAllChildren(): void {
    this.children.forEach((child) => child.unmount());
    this.children = [];
  }

  /**
   * Show component
   */
  public show(): void {
    this.element.style.display = '';
    this.element.classList.remove('hidden');
  }

  /**
   * Hide component
   */
  public hide(): void {
    this.element.style.display = 'none';
    this.element.classList.add('hidden');
  }

  /**
   * Toggle visibility
   */
  public toggle(): void {
    if (this.element.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Add CSS class
   */
  public addClass(...classes: string[]): void {
    this.element.classList.add(...classes);
  }

  /**
   * Remove CSS class
   */
  public removeClass(...classes: string[]): void {
    this.element.classList.remove(...classes);
  }

  /**
   * Toggle CSS class
   */
  public toggleClass(className: string): void {
    this.element.classList.toggle(className);
  }

  /**
   * Check if has CSS class
   */
  public hasClass(className: string): boolean {
    return this.element.classList.contains(className);
  }
}

export default Component;
