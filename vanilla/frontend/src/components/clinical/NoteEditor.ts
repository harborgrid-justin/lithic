// Rich Text Note Editor Component - Vanilla TypeScript
export class NoteEditor {
  private container: HTMLElement;
  private content: string = "";
  private onChange?: (content: string) => void;

  constructor(containerId: string, onChange?: (content: string) => void) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onChange = onChange;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="note-editor">
        <div class="editor-toolbar">
          <button type="button" class="toolbar-btn" data-command="bold" title="Bold">
            <strong>B</strong>
          </button>
          <button type="button" class="toolbar-btn" data-command="italic" title="Italic">
            <em>I</em>
          </button>
          <button type="button" class="toolbar-btn" data-command="underline" title="Underline">
            <u>U</u>
          </button>
          <span class="toolbar-divider"></span>
          <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
            • List
          </button>
          <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
            1. List
          </button>
          <span class="toolbar-divider"></span>
          <button type="button" class="toolbar-btn" data-command="undo" title="Undo">
            ↶ Undo
          </button>
          <button type="button" class="toolbar-btn" data-command="redo" title="Redo">
            ↷ Redo
          </button>
        </div>
        <div
          class="editor-content"
          contenteditable="true"
          id="editor-content"
          spellcheck="true"
        >
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const toolbar = this.container.querySelector(".editor-toolbar");
    toolbar?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest(".toolbar-btn") as HTMLElement;
      if (button) {
        const command = button.getAttribute("data-command");
        if (command) {
          this.executeCommand(command);
        }
      }
    });

    const editorContent = this.container.querySelector(
      "#editor-content",
    ) as HTMLElement;
    editorContent?.addEventListener("input", () => {
      this.content = editorContent.innerHTML;
      if (this.onChange) {
        this.onChange(this.content);
      }
    });
  }

  private executeCommand(command: string): void {
    document.execCommand(command, false);
    const editorContent = this.container.querySelector(
      "#editor-content",
    ) as HTMLElement;
    editorContent?.focus();
  }

  setContent(content: string): void {
    this.content = content;
    const editorContent = this.container.querySelector(
      "#editor-content",
    ) as HTMLElement;
    if (editorContent) {
      editorContent.innerHTML = content;
    }
  }

  getContent(): string {
    return this.content;
  }

  clear(): void {
    this.setContent("");
  }

  setReadOnly(readOnly: boolean): void {
    const editorContent = this.container.querySelector(
      "#editor-content",
    ) as HTMLElement;
    if (editorContent) {
      editorContent.contentEditable = readOnly ? "false" : "true";
    }

    const toolbar = this.container.querySelector(
      ".editor-toolbar",
    ) as HTMLElement;
    if (toolbar) {
      toolbar.style.display = readOnly ? "none" : "flex";
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}

export default NoteEditor;
