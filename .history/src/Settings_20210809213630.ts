import { App, Notice, PluginSettingTab, Setting } from 'obsidian';

import Coalescer from "./main";

export interface FilePath {
	path: string;
	basename: string;
  }
export class Tag{
    path:string; // needs to be 'path' so matchsorter can sort by the same key
}

export interface CoalescerState {
	omittedPaths: string[];
}

export const DEFAULT_SETTINGS: CoalescerState = {
	omittedPaths: [],
}

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
			this.plugin.state.omittedPaths = patterns.split('\n');
            this.plugin.saveData();
		  };
		});
   
	}


}