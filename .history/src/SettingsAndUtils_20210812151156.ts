import { App, Notice, PluginSettingTab, Setting, TFile } from 'obsidian';

import Coalescer from "./main";

//NOTE: in oreder for match-sort to be able to sort based on a key, each of these must have 'basename'

export class File implements Item {
    public isinRoot: boolean;
    constructor(private readonly _fileLikeObj: TFile) {
        this.isinRoot = this.baseMD == this.path;
    }
    public get basename(): string { return this._fileLikeObj.basename; }
    public get altRepresentation(): string { return `[[${this.basename}]]`; }
    public get baseMD(): string { return this._fileLikeObj.basename + '.md'; }
    public get path(): string { return this._fileLikeObj.path; }
    public get tfile(): TFile { return this._fileLikeObj; }
}
export class Tag implements Item {
    constructor(public basename: string, public count: number) { }
    public get altRepresentation(): string { return `#${this.basename}`; }
}
export class Link implements Item {
    constructor(public basename: string, public count: number, public resolved: boolean) { }
    public get altRepresentation(): string { return `[[${this.basename}]]`; }
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

export type YAMLProp = 'tags';



export const getYamlProp = (prop: string) =>
    new RegExp(`(^---(?:.*\\n)*?${prop}: ?)(.*)(\\n(.*(?:\\n|$))*)`);
export const getYamlSub = (parent: string, child: string) =>
    new RegExp(`(^---(?:.*?\\n)*?${parent}:(?:.*\\n)+?.* - ${child}: )(.+)((?:.*(?:\\n|$))*)`);

export const replaceYamlProp = (contents: string, prop: string, newValue: string) =>
    nullReplace(contents, getYamlProp(prop), `$1${newValue}$3`);
export const replaceYamlSub = (contents: string, parent: string, child: string, newValue: string) =>
    nullReplace(contents, getYamlSub(parent, child), `$1${newValue}$3`);

const nullReplace = (input: string, regex: RegExp, replace: string) => {
	let replaced = input.search(regex) >= 0;
	return replaced ? input.replace(regex, replace) : null;
};

const matchYaml = /^---(?:.*\n)*?---/;
const matchYamlEnd = /(^---.*?)(---)/sm;
export const hasYaml = (contents: string) => matchYaml.test(contents);


export function updateYamlProp(propName: YAMLProp, propValue: string | any[], source: string) {
    let [prop, child] = propName.split('.');
    let val = typeof propValue == 'string' ? propValue : `[${propValue.join(', ')}]`;
    let newContents = child ? replaceYamlSub(source, prop, child, val) : replaceYamlProp(source, prop, val);
    let parentUpdated = (!newContents && child) ? nullReplace(source, getYamlProp(prop), `$1\n  - ${child}: ${val}$3`) : null;
    let parentCreated = parentUpdated ? null : source.replace(matchYamlEnd, `$1${prop}:${child ? `\n  - ${child}:` : ''} ${val}\n$2`);

    newContents ??= hasYaml(source) ? parentUpdated ? parentUpdated : parentCreated
        : `---\n${prop}:${child ? `\n  - ${child}:` : ''} ${val}\n---\n`.concat(source); // create new yaml section, optionally with child
    return newContents;
}