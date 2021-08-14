import { CoalescerState, FilePath } from "./Settings";
import { ItemView, Menu, Notice, TFile, WorkspaceLeaf } from 'obsidian';

import Coalescer from "./main";
import List from './List.svelte'

export const CoalesceListView = 'recent-files';
var toType = function(obj: any) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  }
export default class CoalescerListView extends ItemView {
    private readonly plugin: Coalescer;
    private data: CoalescerState;
    comp:List;
    items:(FilePath|string)[];

    constructor(
        leaf: WorkspaceLeaf,
        plugin: Coalescer,
        data: CoalescerState,
    ) {
        super(leaf);

        this.plugin = plugin;
        this.data = data;
        this.items = (this.app.metadataCache as any).getTags();
        console.log(Array.from((this.app.metadataCache as any).getTags()));
        this.redraw();
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
            props: { items: this.items, app: this.app }
        });
    };

}
