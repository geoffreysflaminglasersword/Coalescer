import * as O from 'obsidian'

import CoalescerListView, { CoalesceListView } from "./ListView";
import CoalescerSettingsTab, { CoalescerState, DEFAULT_SETTINGS } from "./SettingsAndUtils";
import { Plugin, WorkspaceLeaf } from 'obsidian';

export default class Coalescer extends Plugin {
	state: CoalescerState;
	view: CoalescerListView;

	async onload() {
		console.log('Loading Coalescer v' + this.manifest.version);
		await this.loadData();
		
		this.addSettingTab(new CoalescerSettingsTab(this.app, this));
		this.registerView(CoalesceListView,
		  (leaf) => (this.view = new CoalescerListView(leaf, this, this.state)),
		);
	
		this.app.workspace.onLayoutReady(this.initView);
		this.registerEvent(this.app.vault.on('create', this.saveData.bind(this)));
		this.registerEvent(this.app.vault.on('rename', this.saveData.bind(this)));
		this.registerEvent(this.app.vault.on('delete', this.saveData.bind(this)));
		(this.app.workspace as any).registerHoverLinkSource(
			CoalesceListView,{display: 'Coalescer',defaultMod: true}
		);
		this.app.workspace.on('active-leaf-change',(leaf) => {

		});
		

	}

	onunload() {
		console.log('unloading Coalescer');
		(this.app.workspace as any).unregisterHoverLinkSource(CoalesceListView);
	}

	public async loadData() {let r = await super.loadData(); console.log(`r`, r); this.state = Object.assign({}, DEFAULT_SETTINGS, r);}
	public async saveData() { 
		console.log(`this.state`, this.state)
		await super.saveData(this.state); 
		this.view?.redraw();
	}
  
	private readonly initView = async () => {
	  let leaf: WorkspaceLeaf = null;
	  for (leaf of this.app.workspace.getLeavesOfType(CoalesceListView)) {
		if (leaf.view instanceof CoalescerListView) return;
		await leaf.setViewState({ type: 'empty' });
		break;
	  }
	  (leaf ?? this.app.workspace.getLeftLeaf(false)).setViewState({
		type: CoalesceListView,
		active: true,
	  });
	};
}



  
  
