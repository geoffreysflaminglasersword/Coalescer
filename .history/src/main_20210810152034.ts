import * as O from 'obsidian'

import CoalescerListView, { CoalesceListView } from "./ListView";
import CoalescerSettingsTab, { CoalescerState, DEFAULT_SETTINGS, IFileLike } from "./Settings";
import { Plugin, TAbstractFile, WorkspaceLeaf } from 'obsidian';

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
		this.registerEvent(this.app.vault.on('rename', this.saveData));
		this.registerEvent(this.app.vault.on('delete', this.saveData));
		(this.app.workspace as any).registerHoverLinkSource(
			CoalesceListView,{display: 'Coalescer',defaultMod: true}
		);
		this.app.workspace.on('active-leaf-change',(leaf) => {

		});
		{
		this.registerCodeMirror(cm => {
			cm.on('contextmenu',(cm,e) => {
				console.log('ctxmen: ',cm,e);
			})
		})
		console.log(`this.app`, this.app)
		// @ts-ignore
		console.log(this.app.metadataCache.getTags())
		// O.getAllTags(this.app.metadataCache)
		
		this.app.workspace.on('editor-menu',(menu,editor,view) => {
			console.log(`menu,editor,view`, menu,editor,view);
		})
		this.app.workspace.on('file-menu',(menu,file,source,leaf) => {
			console.log(`menu,file,source,leaf`,menu,file,source,leaf);
		})
		}

		Object.entries(this.app.metadataCache.unresolvedLinks).forEach(([key, value]) => {
			console.log(key)
			console.log(value)
			Object.entries(value).forEach(([key, value]) => {
				console.log(key)
				console.log(value)
			});
		});




	}

	onunload() {
		console.log('unloading Coalescer');
		(this.app.workspace as any).unregisterHoverLinkSource(CoalesceListView);
	}

	public async loadData() {this.state = Object.assign({}, DEFAULT_SETTINGS, await super.loadData());}
	public async saveData() { 
		await super.saveData(this.state); 
		this.view.redraw();
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



  
  
