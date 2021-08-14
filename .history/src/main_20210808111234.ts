import * as O from 'obsidian'

import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class Coalescer extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();
		this.addSettingTab(new CoalescerSettingsTab(this.app, this));
		this.registerCodeMirror(cm => {
		});
		this.app.workspace.on('editor-menu',(menu,editor,view) => {
			console.log(`menu,editor,view`, menu,editor,view);
		})
		this.app.workspace.on('file-menu',(menu,file,source,leaf) => {
			console.log(`menu,file,source,leaf`,menu,file,source,leaf);
		})
		
		this.registerCodeMirror(cm => {
			cm.on('contextmenu',(cm,e) => {
				console.log('ctxmen: ',cm,e);
			})
		})
		console.log(`this.app`, this.app)
		// @ts-ignore
		console.log(this.app.metadataCache.getTags())
		// O.getAllTags(this.app.metadataCache)


		
	}

	
	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CoalescerModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class CoalescerSettingsTab extends PluginSettingTab {
	plugin: Coalescer;

	constructor(app: App, plugin: Coalescer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}