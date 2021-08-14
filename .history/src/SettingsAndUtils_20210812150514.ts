import { App, Notice, PluginSettingTab, Setting } from 'obsidian';

import Coalescer from "./main";

//NOTE: in oreder for match-sort to be able to sort based on a key, each of these must have 'basename'
export interface IFileLike {
	path: string;
	basename: string;
  }
export class File implements Item {
    public isinRoot:boolean;
    constructor(private _fileLikeObj:IFileLike){
        this.isinRoot = this.baseMD == this.path;
    }  
    public get basename(): string {
        return this._fileLikeObj.basename;
    }
    public get altRepresentation(): string {
        return `[[${this.basename}]]`;
    }
    public get baseMD(): string {
        return this._fileLikeObj.basename +'.md';
    }
    public get path(): string {
        return this._fileLikeObj.path;
    }
}
export class Tag implements Item,HasCount{
    constructor(public basename:string,public count:number){}
    public get altRepresentation(): string {
        return `#${this.basename}`;
    }
}
export class Link implements Item,HasCount{
    constructor(public basename:string,public count:number,public resolved:boolean){}
    public get altRepresentation(): string {
        return `[[${this.basename}]]`;
    }
}
export interface HasCount {
    count:number;
}


export interface Item  {
    basename:string;
    altRepresentation:string;
};


export interface CoalescerState {
	omittedPaths: string[];
    showFiles:boolean;
    showTags:boolean;
    linkView: LinkOpt;
}

export const DEFAULT_SETTINGS: CoalescerState = {
	omittedPaths: [],
    showFiles:true,
    showTags:true,
    linkView:'All'
}

type TFromArray<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer TFromArray> ? TFromArray : never;
export const linkOpts = ["All", "Resolved", "Unresolved","None"] as const;
export type LinkOpt = TFromArray<typeof linkOpts>;

export default class CoalescerSettingsTab extends PluginSettingTab {
	plugin: Coalescer;

	constructor(app: App, plugin: Coalescer) {
		super(app, plugin);
		this.plugin = plugin;
	}
  
	public display(): void {
	  const { containerEl } = this;
	  containerEl.empty();
	  containerEl.createEl('h2', { text: 'Recent Files List' });
  
  
	  new Setting(containerEl)
		.setName('Path Exclusions')
        .setDesc('Exclude file paths or tags using regex')
		.addTextArea((textArea) => {
		  textArea.inputEl.setAttr('rows', 6);
		  textArea
			.setPlaceholder('^daily/\n\\.png$\netc...')
			.setValue(this.plugin.state.omittedPaths.join('\n'));
		  textArea.inputEl.onblur = (e: FocusEvent) => {

			const patterns = (e.target as HTMLInputElement).value;
			this.plugin.state.omittedPaths = patterns.split('\n').filter(p => p.length);
            this.plugin.saveData();
		  };
		});
   
	}


}