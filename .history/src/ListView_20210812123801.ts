import { App, ButtonComponent, FuzzyMatch, FuzzySuggestModal, ItemView, Menu, Notice, Scope, SuggestModal, TAbstractFile, TFile, TextComponent, WorkspaceLeaf } from 'obsidian';
import { CoalescerState, File, IFileLike, Item, Link, Tag } from "./Settings";

import Coalescer from "./main";
import List from './List.svelte'
import { debug } from "svelte/internal";

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
        let unt = this.app.vault.getMarkdownFiles().filter(f => !!f.basename.match(/^Untitled \d/));
        console.log(`unt`, unt);
        let [mergeto,mergefrom] = unt;
        
        

        (this.app.fileManager as any).mergeFile(mergeto,mergefrom)
        console.log('Finished');

        this.items = []
        for (const jeff of Object.entries((this.app.metadataCache as any).getTags())) {
            let [key, value] = jeff;
            let ted = new Tag(key.replace(/#/,''),value);
            this.items.push([ted,false])
        }

        const matchFileName = /(?<=[\/\\]|^)([^\/\\]+?)(?:\.md)?$/; //also matches when it's just a name, e.g. 'file.md', with no slashes

        console.log(`this.app.metadataCache.unresolvedLinks`, this.app.metadataCache.unresolvedLinks);
        
        let links = new Map<string,number>();
        
        let extractLinks=(cachedLinks:any[])  => {
            cachedLinks.forEach(([path, link]) => {
                if (this.plugin.state.omittedPaths.some(matcher => path.match(new RegExp(matcher, 'i'))))
                    return;
                Object.entries(link).forEach(([name, count]) => {
                    name = name.match(matchFileName, '$1')[1];
                    links.set(name, links.get(name) ? links.get(name) + count : count);
                });
            });
        }
        extractLinks(Object.entries(this.app.metadataCache.resolvedLinks));
        links.forEach((value,key) =>  this.items.push([new Link(key,value,true),false]))
        links.clear();
        extractLinks(Object.entries(this.app.metadataCache.unresolvedLinks));
        links.forEach((value,key) =>  this.items.push([new Link(key,value,false),false]))


        this.app.vault.getMarkdownFiles().filter(
            f => this.plugin.state.omittedPaths.every(p => !p || !f.path.match(new RegExp(p,'i')))
            ).map<[Item, boolean]>(v => [new File(v), false]).forEach(v => this.items.push(v));

        const contentEl = this.containerEl.children[1];
        this.comp?.$destroy();
        this.comp = new List({
            target: contentEl,
            props: {
                items: this.items,
                app: this.app,
                state:this.plugin.state
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
