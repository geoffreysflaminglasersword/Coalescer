import { CoalescerState, FilePath } from "./Settings";
import { ItemView, Menu, Notice, TFile, WorkspaceLeaf } from 'obsidian';

import Coalescer from "./main";
import ListView from '*.svelte'

export const CoalesceListView = 'recent-files';

export default class CoalescerListView extends ItemView {
    private readonly plugin: Coalescer;
    private data: CoalescerState;
    comp:ListView;
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

        // const contentEl = this.containerEl.children[1];
        // contentEl.empty();
        // contentEl.appendChild(rootEl);
        this.comp?.$destroy();
        this.comp = new ListView({
            target: this.containerEl.children[1],
            props: { items: this.items }
        });
    };

}
