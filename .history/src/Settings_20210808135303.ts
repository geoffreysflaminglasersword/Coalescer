import { App, Notice, PluginSettingTab, Setting } from 'obsidian';

import Coalescer from "./main";

interface FilePath {
	path: string;
	basename: string;
  }

interface MyPluginSettings {
	mySetting: string;
	recentFiles: FilePath[];
	omittedPaths: string[];
	maxLength: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	recentFiles: [],
	omittedPaths: [],
	maxLength: null,
}

class CoalescerSettingsTab extends PluginSettingTab {
	plugin: Coalescer;

	constructor(app: App, plugin: Coalescer) {
		super(app, plugin);
		this.plugin = plugin;
	}
  
	public display(): void {
	  const { containerEl } = this;
	  containerEl.empty();
	  containerEl.createEl('h2', { text: 'Recent Files List' });
  
	  const fragment = document.createDocumentFragment();
	  const link = document.createElement('a');
	  link.href =
		'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#writing_a_regular_expression_pattern';
	  link.text = 'MDN - Regular expressions';
	  fragment.append('RegExp patterns to ignore. One pattern per line. See ');
	  fragment.append(link);
	  fragment.append(' for help.');
  
	  new Setting(containerEl)
		.setName('Omitted pathname patterns')
		.setDesc(fragment)
		.addTextArea((textArea) => {
		  textArea.inputEl.setAttr('rows', 6);
		  textArea
			.setPlaceholder('^daily/\n\\.png$\nfoobar.*baz')
			.setValue(this.plugin.data.omittedPaths.join('\n'));
		  textArea.inputEl.onblur = (e: FocusEvent) => {
			const patterns = (e.target as HTMLInputElement).value;
			this.plugin.data.omittedPaths = patterns.split('\n');
			this.plugin.pruneOmittedFiles();
			this.plugin.view.redraw();
		  };
		});
  
	  new Setting(containerEl)
		.setName('List length')
		.setDesc('Maximum number of filenames to keep in the list.')
		.addText((text) => {
		  text.inputEl.setAttr('type', 'number');
		  text.inputEl.setAttr('placeholder', defaultMaxLength);
		  text
			.setValue(this.plugin.data.maxLength?.toString())
			.onChange((value) => {
			  const parsed = parseInt(value, 10);
			  if (!Number.isNaN(parsed) && parsed <= 0) {
				new Notice('List length must be a positive integer');
				return;
			  }
			});
		  text.inputEl.onblur = (e: FocusEvent) => {
			const maxfiles = (e.target as HTMLInputElement).value;
			const parsed = parseInt(maxfiles, 10);
			this.plugin.data.maxLength = parsed;
			this.plugin.pruneLength();
			this.plugin.view.redraw();
		  };
		});
   
	}


}