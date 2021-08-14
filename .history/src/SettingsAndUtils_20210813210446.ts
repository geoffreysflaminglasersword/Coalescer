import { App, Notice, PluginSettingTab, Setting, TFile } from 'obsidian';

import Coalescer from "./main";

//NOTE: in oreder for match-sort to be able to sort based on a key, each of these must have 'basename'

export class File implements Item {
    public isinRoot: boolean;
    public selected:boolean;
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
    public selected:boolean;
    constructor(public basename: string, public count: number) { }
    public get altRepresentation(): string { return `#${this.basename}`; }
}
export class Link implements Item {
    public selected:boolean;
    constructor(public basename: string, public count: number, public resolved: boolean) { }
    public get altRepresentation(): string { return `[[${this.basename}]]`; }
}


export interface Item  {
    basename:string;
    altRepresentation:string;
    selected:boolean;
};


export interface CoalescerState {
	omittedPaths: string[];
	omittedTags: string[];
    showFiles:boolean;
    showTags:boolean;
    linkView: LinkOpt;
}

export const DEFAULT_SETTINGS: CoalescerState = {
	omittedPaths: [],
	omittedTags: [],
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
            .setDesc('Exclude file paths and links using regex')
            .addTextArea((textArea) => {
                textArea.inputEl.setAttr('rows', 6);
                textArea.inputEl.style.width ='100%'
                textArea
                    .setPlaceholder('^daily/\n\\.png$\netc...')
                    .setValue(this.plugin.state.omittedPaths.join('\n'));
                textArea.inputEl.onblur = (e: FocusEvent) => {

                    const patterns = (e.target as HTMLInputElement).value;
                    this.plugin.state.omittedPaths = patterns.split('\n').filter(p => p.length);
                    this.plugin.saveData();
                };
            }).controlEl.style.width ='40%';

        new Setting(containerEl)
            .setName('Tag Exclusions')
            .setDesc('Exclude tags using regex')
            .addTextArea((textArea) => {
                textArea.inputEl.setAttr('rows', 6);
                textArea.inputEl.style.width ='100%'

                textArea
                    .setPlaceholder('^#ithHash\nnoHash\netc...')
                    .setValue(this.plugin.state.omittedTags.join('\n'));
                textArea.inputEl.onblur = (e: FocusEvent) => {
                    const patterns = (e.target as HTMLInputElement).value;
                    this.plugin.state.omittedTags = patterns.split('\n').filter(p => p.length);
                    this.plugin.saveData();
                };
            }).controlEl.style.width ='40%';
    }


}

export type YAMLProp = 'tags'|'aliases';



export const rxGetYamlProp = (prop: string) =>
    new RegExp(`(^---(?:.*\\n)*?${prop}: ?)(.*)(\\n(.*(?:\\n|$))*)`);
export const getYamlSub = (parent: string, child: string) =>
    new RegExp(`(^---(?:.*?\\n)*?${parent}:(?:.*\\n)+?.* - ${child}: )(.+)((?:.*(?:\\n|$))*)`);

export const replaceYamlProp = (contents: string, prop: string, newValue: string) =>
    nullReplace(contents, rxGetYamlProp(prop), `$1${newValue}$3`);
export const replaceYamlSub = (contents: string, parent: string, child: string, newValue: string) =>
    nullReplace(contents, getYamlSub(parent, child), `$1${newValue}$3`);

const nullReplace = (input: string, regex: RegExp, replace: string) => {
	let replaced = input.search(regex) >= 0;
	return replaced ? input.replace(regex, replace) : null;
};

const matchYaml = /^---(?:.*\n)*?---/;
const matchYamlEnd = /(^---.*?)(---)/sm;
export const hasYaml = (contents: string) => matchYaml.test(contents);


export function updateYamlProp(propName: YAMLProp, propValue: string | any[], source: string,replace=false) {
    let [prop, child] = propName.split('.');
    let existing:string[] = [];
    if(!replace) existing = getYamlProp(propName, source);
    propValue = typeof propValue == 'string' ? [propValue] : propValue;
    propValue = [...new Set(propValue.concat(existing))];
    let val = `[${propValue.join(', ')}]`;
    let newContents = child ? replaceYamlSub(source, prop, child, val) : replaceYamlProp(source, prop, val);
    let parentUpdated = (!newContents && child) ? nullReplace(source, rxGetYamlProp(prop), `$1\n  - ${child}: ${val}$3`) : null;
    let parentCreated = parentUpdated ? null : source.replace(matchYamlEnd, `$1${prop}:${child ? `\n  - ${child}:` : ''} ${val}\n$2`);

    newContents ??= hasYaml(source) ? parentUpdated ? parentUpdated : parentCreated
        : `---\n${prop}:${child ? `\n  - ${child}:` : ''} ${val}\n---\n`.concat(source); // create new yaml section, optionally with child
    return newContents;
}

export function getYamlProp(propName: YAMLProp, source: string) : string[]{
    let [prop, child] = propName.split('.');
    let match = child ? source.match(getYamlSub(prop, child)) : source.match(rxGetYamlProp(prop));
    let val = match ? match[2] : null;
    if(!val) return [];
    return val.match(/\[/) ? val.replace('[', '').replace(']', '').split(', ') : [val];
}

