import {ItemView, Menu, Notice, TFile, WorkspaceLeaf} from 'obsidian';

import Coalescer from "./main";

const defaultMaxLength: number = 50;

  
const RecentFilesListViewType = 'recent-files';

export default class RecentFilesListView extends ItemView {
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
