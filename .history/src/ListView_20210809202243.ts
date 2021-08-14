import { App, ButtonComponent, FuzzyMatch, FuzzySuggestModal, ItemView, Menu, Notice, Scope, SuggestModal, TAbstractFile, TextComponent, TFile, WorkspaceLeaf } from 'obsidian';
import { CoalescerState, FilePath } from "./Settings";

import Coalescer from "./main";
import List from './List.svelte'

export const CoalesceListView = 'recent-files';






export abstract class SuggestionModal<T> extends FuzzySuggestModal<T> {
    items: T[] = [];
    suggestions: HTMLDivElement[];
    scope: Scope = new Scope();
    suggestEl: HTMLDivElement;
    promptEl: HTMLDivElement;
    emptyStateText: string = "No match found";
    limit: number = 100;
    constructor(app: App, inputEl: HTMLInputElement, items: T[]) {
        super(app);
        this.inputEl = inputEl;
        this.items = items;

        this.suggestEl = createDiv("suggestion-container");

        this.contentEl = this.suggestEl.createDiv("suggestion");


        this.scope.register([], "Escape", this.close.bind(this));

        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        // this.inputEl.addEventListener("blur", this.close.bind(this));
        this.suggestEl.on(
            "mousedown",
            ".suggestion-container",
            (event: MouseEvent) => {
                event.preventDefault();
            }
        );
    }
    empty() {
    }
    onInputChanged(): void {
        const inputStr = this.modifyInput(this.inputEl.value);
        const suggestions = this.getSuggestions(inputStr);

        this.open();
    }

    modifyInput(input: string): string {
        return input;
    }
    onNoSuggestion() {
        this.empty();
        this.renderSuggestion(
            null,
            this.contentEl.createDiv("suggestion-item")
        );
    }
    open(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.pushScope(this.scope);
        document.body.appendChild(this.suggestEl);
    }

    close(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.popScope(this.scope);
        this.suggestEl.detach();
    }
    createPrompt(prompts: HTMLSpanElement[]) {
        if (!this.promptEl)
            this.promptEl = this.suggestEl.createDiv("prompt-instructions");
        let prompt = this.promptEl.createDiv("prompt-instruction");
        for (let p of prompts) {
            prompt.appendChild(p);
        }
    }
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    abstract getItemText(arg: T): string;
    abstract getItems(): T[];
}

export class CoalesceSuggest extends SuggestionModal<string> {

    // constructor(app: App, input: TextComponent, items: string[]) {
    //     super(app, input.inputEl, items);

    //     this.inputEl.addEventListener("input", this.getItem.bind(this));
    // }
    getItem() {
        const v = this.inputEl.value;
        this.onInputChanged();
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
    }
    getItemText(arg: string): string {
        return arg;
    }
    getItems(): string[] {
                // const abstractFiles = this.app.vault.getAllLoadedFiles();
        // const files: TFile[] = [];
        // const lowerCaseInputStr = inputStr.toLowerCase();
    
        // abstractFiles.forEach((file: TAbstractFile) => {
        //   if (
        //     file instanceof TFile &&
        //     file.extension === "md" &&
        //     file.path.toLowerCase().contains(lowerCaseInputStr)
        //   ) {
        //     files.push(file);
        //   }
        // });
        // return files.map(f => f.path);
        return ['asdf','aaa','fdsa']
    }
    
    // renderSuggestion(value: string, el: HTMLElement) {
    //     el.setText(value);
    // }
    // onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {

    // }
    // getSuggestions(inputStr: string) {

    // }
  
    // renderSuggestion(file: TFile, el: HTMLElement): void {
    //   el.setText(file.path);
    // }
  
    // selectSuggestion(file: TFile): void {
    //   this.inputEl.value = file.path;
    //   this.inputEl.trigger("input");
    //   this.close();
    // }
  }

export default class CoalescerListView extends ItemView {
    private readonly plugin: Coalescer;
    private data: CoalescerState;
    comp:List;
    items:[(FilePath|string),boolean][] = [];
    suggest:CoalesceSuggest;
    button :ButtonComponent;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: Coalescer,
        data: CoalescerState,
    ) {
        super(leaf);

        this.plugin = plugin;
        this.data = data;
        this.app.workspace.onLayoutReady(() => {
            this.items = this.app.vault.getMarkdownFiles().map(v => [v,false]);
            let items = (this.app.metadataCache as any).getTags();
            Object.keys(items).map(key => this.items.push([key,false]));
            this.redraw();

        })
    }

    public getViewType(): string { return CoalesceListView; }
    public getDisplayText(): string { return 'Recent Files'; }
    public getIcon(): string { return 'clock'; }

    public onHeaderMenu(menu: Menu): void {
        menu
            .addItem((item) => {
                item
                    .setTitle('Clear list')
                    .setIcon('sweep')
                    .onClick(async () => {
                        await this.plugin.saveData();
                        this.redraw();
                    });
            })
            .addItem((item) => {
                item
                    .setTitle('Close')
                    .setIcon('cross')
                    .onClick(() => {
                        this.app.workspace.detachLeavesOfType(CoalesceListView);
                    });
            });
    }

    public load(): void {
        super.load();
    }

    public readonly redraw = (): void => {
        // const openFile = this.app.workspace.getActiveFile();

        const contentEl = this.containerEl.children[1];
        contentEl.empty();
        // contentEl.appendChild(rootEl);
        console.log(`this.items`, this.items)
        this.comp?.$destroy();
        this.comp = new List({
            target: contentEl,
            props: { 
                items: this.items, 
                app: this.app,
                leaf:this.leaf
            }
        });
    };

}
