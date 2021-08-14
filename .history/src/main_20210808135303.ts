import * as O from 'obsidian'

import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, WorkspaceLeaf } from 'obsidian';

export default class Coalescer extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('loading plugin');

		console.log('Recent Files: Loading plugin v' + this.manifest.version);
  
		await this.loadData();
	
	
		this.registerView(
		  RecentFilesListViewType,
		  (leaf) => (this.view = new RecentFilesListView(leaf, this, this.data)),
		);
	
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.app.workspace as any).registerHoverLinkSource(
		  RecentFilesListViewType,
		  {
			display: 'Recent Files',
			defaultMod: true,
		  },
		);
	
		if (this.app.workspace.layoutReady) {
		  this.initView();
		} else {
			this.app.workspace.onLayoutReady(this.initView);
		}
	


		this.registerEvent(this.app.vault.on('rename', this.handleRename));
		this.registerEvent(this.app.vault.on('delete', this.handleDelete));
	
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
			  // eslint-disable-next-line @typescript-eslint/no-explicit-any
			  (this.app.workspace as any).unregisterHoverLinkSource(
				RecentFilesListViewType,
			  );
	}


	public data: MyPluginSettings;
	public view: RecentFilesListView;

	public async loadData(): Promise<void> {
		this.data = Object.assign({}, DEFAULT_SETTINGS, await super.loadData());
	  if (!this.data.maxLength) {
		console.log(
		  'Recent Files: maxLength is not set, using default (' +
			defaultMaxLength.toString() +
			')',
		);
	  }
	}
  
	public async saveData(): Promise<void> {
	  await super.saveData(this.data);
	}
  
	public readonly pruneOmittedFiles = async (): Promise<void> => {
	  this.data.recentFiles = this.data.recentFiles.filter(this.shouldAddFile);
	  await this.saveData();
	};
  
	public readonly pruneLength = async (): Promise<void> => {
	  const toRemove =
		this.data.recentFiles.length - (this.data.maxLength || defaultMaxLength);
	  if (toRemove > 0) {
		this.data.recentFiles.splice(
		  this.data.recentFiles.length - toRemove,
		  toRemove,
		);
	  }
	  await this.saveData();
	};
  
	public readonly shouldAddFile = (file: FilePath): boolean => {
	  const patterns: string[] = this.data.omittedPaths.filter(
		(path) => path.length > 0,
	  );
	  const fileMatchesRegex = (pattern: string): boolean => {
		try {
		  return new RegExp(pattern).test(file.path);
		} catch (err) {
		  console.error('Recent Files: Invalid regex pattern: ' + pattern);
		  return false;
		}
	  };
	  return !patterns.some(fileMatchesRegex);
	};
  
	private readonly initView = async (): Promise<void> => {
	  let leaf: WorkspaceLeaf = null;
	  for (leaf of this.app.workspace.getLeavesOfType(RecentFilesListViewType)) {
		if (leaf.view instanceof RecentFilesListView) return;
		// The view instance was created by an older version of the plugin,
		// so clear it and recreate it (so it'll be the new version).
		// This avoids the need to reload Obsidian to update the plugin.
		await leaf.setViewState({ type: 'empty' });
		break;
	  }
	  (leaf ?? this.app.workspace.getLeftLeaf(false)).setViewState({
		type: RecentFilesListViewType,
		active: true,
	  });
	};
  
	private readonly handleRename = async (
	  file: TAbstractFile,
	  oldPath: string,
	): Promise<void> => {
	  const entry = this.data.recentFiles.find(
		(recentFile) => recentFile.path === oldPath,
	  );
	  if (entry) {
		entry.path = file.path;
		entry.basename = this.trimExtension(file.name);
		this.view.redraw();
		await this.saveData();
	  }
	};
  
	private readonly handleDelete = async (
	  file: TAbstractFile,
	): Promise<void> => {
	  const beforeLen = this.data.recentFiles.length;
	  this.data.recentFiles = this.data.recentFiles.filter(
		(recentFile) => recentFile.path !== file.path,
	  );
  
	  if (beforeLen !== this.data.recentFiles.length) {
		this.view.redraw();
		await this.saveData();
	  }
	};
  
	// trimExtension can be used to turn a filename into a basename when
	// interacting with a TAbstractFile that does not have a basename property.
	// private readonly trimExtension = (name: string): string => name.split('.')[0];
	// from: https://stackoverflow.com/a/4250408/617864
	private readonly trimExtension = (name: string): string =>
	  name.replace(/\.[^/.]+$/, '');








}



  
  
