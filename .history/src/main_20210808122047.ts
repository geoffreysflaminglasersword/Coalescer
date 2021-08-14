import * as O from 'obsidian'

import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {ItemView, Menu, TAbstractFile, TFile, WorkspaceLeaf} from 'obsidian';

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
		this.data = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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






  
  interface FilePath {
	path: string;
	basename: string;
  }
  
  
  const defaultMaxLength: number = 50;

  
  const RecentFilesListViewType = 'recent-files';
  
  class RecentFilesListView extends ItemView {
	private readonly plugin: Coalescer;
	private data: MyPluginSettings;
  
	constructor(
	  leaf: WorkspaceLeaf,
	  plugin: Coalescer,
	  data: MyPluginSettings,
	) {
	  super(leaf);
  
	  this.plugin = plugin;
	  this.data = data;
	  this.redraw();
	}
  
	public getViewType(): string {
	  return RecentFilesListViewType;
	}
  
	public getDisplayText(): string {
	  return 'Recent Files';
	}
  
	public getIcon(): string {
	  return 'clock';
	}
  
	public onHeaderMenu(menu: Menu): void {
	  menu
		.addItem((item) => {
		  item
			.setTitle('Clear list')
			.setIcon('sweep')
			.onClick(async () => {
			  this.data.recentFiles = [];
			  await this.plugin.saveData();
			  this.redraw();
			});
		})
		.addItem((item) => {
		  item
			.setTitle('Close')
			.setIcon('cross')
			.onClick(() => {
			  this.app.workspace.detachLeavesOfType(RecentFilesListViewType);
			});
		});
	}
  
	public load(): void {
	  super.load();
	  this.registerEvent(this.app.workspace.on('file-open', this.update));
	}
  
	public readonly redraw = (): void => {
	  const openFile = this.app.workspace.getActiveFile();
  
	  const rootEl = createDiv({ cls: 'nav-folder mod-root' });
	  const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });
  
	  this.data.recentFiles.forEach((currentFile) => {
		const navFile = childrenEl.createDiv({ cls: 'nav-file' });
		const navFileTitle = navFile.createDiv({ cls: 'nav-file-title' });
  
		if (openFile && currentFile.path === openFile.path) {
		  navFileTitle.addClass('is-active');
		}
  
		navFileTitle.createDiv({
		  cls: 'nav-file-title-content',
		  text: currentFile.basename,
		});
  
		navFile.setAttr('draggable', 'true');
		navFile.addEventListener('dragstart', (event: DragEvent) => {
		  const file = this.app.metadataCache.getFirstLinkpathDest(
			currentFile.path,
			'',
		  );
  
		  // eslint-disable-next-line @typescript-eslint/no-explicit-any
		  const dragManager = (this.app as any).dragManager;
		  const dragData = dragManager.dragFile(event, file);
		  dragManager.onDragStart(event, dragData);
		});
  
		navFile.addEventListener('mouseover', (event: MouseEvent) => {
		  this.app.workspace.trigger('hover-link', {
			event,
			source: RecentFilesListViewType,
			hoverParent: rootEl,
			targetEl: navFile,
			linktext: currentFile.path,
		  });
		});
  
		navFile.addEventListener('contextmenu', (event: MouseEvent) => {
		  const menu = new Menu(this.app);
		  const file = this.app.vault.getAbstractFileByPath(currentFile.path);
		  this.app.workspace.trigger(
			'file-menu',
			menu,
			file,
			'link-context-menu',
			this.leaf,
		  );
		  menu.showAtPosition({ x: event.clientX, y: event.clientY });
		});
  
		navFile.addEventListener('click', (event: MouseEvent) => {
		  this.focusFile(currentFile, event.ctrlKey || event.metaKey);
		});
	  });
  
	  const contentEl = this.containerEl.children[1];
	  contentEl.empty();
	  contentEl.appendChild(rootEl);
	};
  
	private readonly updateData = async (file: TFile): Promise<void> => {
	  this.data.recentFiles = this.data.recentFiles.filter(
		(currFile) => currFile.path !== file.path,
	  );
	  this.data.recentFiles.unshift({
		basename: file.basename,
		path: file.path,
	  });
  
	  await this.plugin.pruneLength(); // Handles the save
	};
  
	private readonly update = async (openedFile: TFile): Promise<void> => {
	  if (!openedFile || !this.plugin.shouldAddFile(openedFile)) {
		return;
	  }
  
	  await this.updateData(openedFile);
	  this.redraw();
	};
  
	/**
	 * Open the provided file in the most recent leaf.
	 *
	 * @param shouldSplit Whether the file should be opened in a new split, or in
	 * the most recent split. If the most recent split is pinned, this is set to
	 * true.
	 */
	private readonly focusFile = (file: FilePath, shouldSplit = false): void => {
	  const targetFile = this.app.vault
		.getFiles()
		.find((f) => f.path === file.path);
  
	  if (targetFile) {
		let leaf = this.app.workspace.getMostRecentLeaf();
  
		const createLeaf = shouldSplit || leaf.getViewState().pinned;
		if (createLeaf) {
		  leaf = this.app.workspace.createLeafBySplit(leaf);
		}
		leaf.openFile(targetFile);
	  } else {
		new Notice('Cannot find a file with that name');
		this.data.recentFiles = this.data.recentFiles.filter(
		  (fp) => fp.path !== file.path,
		);
		this.plugin.saveData();
		this.redraw();
	  }
	};
  }
