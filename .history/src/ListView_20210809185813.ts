import { ButtonComponent, FuzzySuggestModal, ItemView, Menu, Notice, SuggestModal, TFile, WorkspaceLeaf } from 'obsidian';
import { CoalescerState, FilePath } from "./Settings";

import Coalescer from "./main";
import List from './List.svelte'

export const CoalesceListView = 'recent-files';
var toType = function(obj: any) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  }

  class sugg extends FuzzySuggestModal<string>{
      getItems(): string[] {
         return ['jeff','twelve','seventeen'];
      }
      getItemText(item: string): string {
         return item;
      }
      onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
          console.log('chose: '+ item)
      }

  }
export default class CoalescerListView extends ItemView {
    private readonly plugin: Coalescer;
    private data: CoalescerState;
    comp:List;
    items:[(FilePath|string),boolean][] = [];
    suggest:FuzzySuggestModal<string>;
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
            this.suggest = new sugg(this.app);
            this.button = new ButtonComponent(this.contentEl)
            this.suggest.contentEl=this.button.buttonEl;
            this.suggest.open();
            // this.redraw();

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
