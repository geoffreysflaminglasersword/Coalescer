import { ButtonComponent, FuzzySuggestModal, ItemView, Menu, Notice, SuggestModal, TAbstractFile, TFile, WorkspaceLeaf } from 'obsidian';
import { CoalescerState, FilePath } from "./Settings";

import Coalescer from "./main";
import List from './List.svelte'

export const CoalesceListView = 'recent-files';



export class CoalesceSuggest extends SuggestModal<string> {
    renderSuggestion(value: string, el: HTMLElement) {
        el.setText(value);
    }
    onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {

    }
    getSuggestions(inputStr: string) {
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
        return ['jeff','ted']
    }
  
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
