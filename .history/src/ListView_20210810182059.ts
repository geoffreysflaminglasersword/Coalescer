import { App, ButtonComponent, FuzzyMatch, FuzzySuggestModal, ItemView, Menu, Notice, Scope, SuggestModal, TAbstractFile, TFile, TextComponent, WorkspaceLeaf } from 'obsidian';
import { CoalescerState, File, IFileLike, Item, Tag, UnresolvedLink } from "./Settings";

import Coalescer from "./main";
import List from './List.svelte'

export const CoalesceListView = 'recent-files';


export default class CoalescerListView extends ItemView {
    private readonly plugin: Coalescer;
    private data: CoalescerState;
    comp:List;
    items:[Item,boolean][] = [];
    button :ButtonComponent;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: Coalescer,
        data: CoalescerState,
    ) {
        super(leaf);

        this.plugin = plugin;
        this.data = data;
        this.app.workspace.onLayoutReady(() => this.redraw())
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
        this.items = []
        for (const jeff of Object.entries((this.app.metadataCache as any).getTags())) {
            let [key, value] = jeff;
            let ted = new Tag(key.replace(/#/,''),value);
            this.items.push([ted,false])
        }

        Object.entries(this.app.metadataCache.unresolvedLinks).forEach(([key, value]) => {
			Object.entries(value).forEach(([key, value]) => {
                this.items.push([new UnresolvedLink(key,value),false])
				console.log(key)
				console.log(value)
			});
		});

        this.app.vault.getMarkdownFiles().filter(
            f => this.plugin.state.omittedPaths.every(p => !p || !f.path.match(p))
            ).map<[Item, boolean]>(v => [new File(v), false]).forEach(v => this.items.push(v));

        const contentEl = this.containerEl.children[1];
        this.comp?.$destroy();
        this.comp = new List({
            target: contentEl,
            props: {
                items: this.items,
                app: this.app,
                leaf: this.leaf
            }
        });






        
        // const openFile = this.app.workspace.getActiveFile();

        // const contentEl = this.containerEl.children[1];
        // contentEl.empty();
        // // contentEl.appendChild(rootEl);
        // console.log(`this.items`, this.items)
        // this.comp?.$destroy();
        // this.comp = new List({
        //     target: contentEl,
        //     props: { 
        //         items: this.items, 
        //         app: this.app,
        //         leaf:this.leaf
        //     }
        // });
    };

}
