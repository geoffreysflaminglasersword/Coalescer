<script lang="ts">
  import ListItem from "./ListItem.svelte";
  import { App, ItemView, Menu, Notice, TFile, WorkspaceLeaf } from "obsidian";
  import { CoalesceListView } from "./ListView";
  import { FilePath } from "./Settings";
  let rootEl: HTMLElement;

  // your script goes here
  export let items: (FilePath | string)[];
  export let app:App;

  console.log(`asdfthis.items`, this.items)


  let dragstart = (event: DragEvent) => {
    const file = this.app.metadataCache.getFirstLinkpathDest("" /* currentFile.path */, "");
    const dragManager = (this.app as any).dragManager;
    const dragData = dragManager.dragFile(event, file);
    dragManager.onDragStart(event, dragData);
  };

  let focus = () => {};
  let mouseover = (item: string) =>
    ((event: MouseEvent) => {
      this.app.workspace.trigger("hover-link", {
        event,
        source: CoalesceListView,
        hoverParent: rootEl,
        targetEl: event.target,
        linktext: item,
      });
    }).bind(item);

  let contextmenu = (item: string) =>
    ((event: MouseEvent) => {
      const menu = new Menu(this.app);
      const file = this.app.vault.getAbstractFileByPath(item);
      this.app.workspace.trigger("file-menu", menu, file, "link-context-menu", this.leaf);
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    }).bind(item);

  let click = (item: FilePath) =>
    ((event: MouseEvent) => {
      focusFile(item, event.ctrlKey || event.metaKey);
    }).bind(item);

  let focusFile = (file: FilePath, shouldSplit = false): void => {
    const targetFile = app.vault.getFiles().find(f => f.path === file.path);
    if (targetFile) {
      let leaf = app.workspace.getMostRecentLeaf();

      const createLeaf = shouldSplit || leaf.getViewState().pinned;
      if (createLeaf) {
        leaf = app.workspace.createLeafBySplit(leaf);
      }
      leaf.openFile(targetFile);
    }
  };
</script>

<div class="nav-folder mod-root" bind:this={rootEl}>
  <div class="nav-folder-children">
    {#each items as item}
      {#if typeof item == "string"}
        <div
          class="nav-file"
          draggable={true}
          on:dragstart={dragstart}
          on:mouseover={mouseover(item)}
          on:focus={focus}
          on:contextmenu={contextmenu(item)}
        >
          <ListItem content={item} />
        </div>
      {:else}
        <div
          class="nav-file"
          draggable={true}
          on:dragstart={dragstart}
          on:mouseover={mouseover(item.path)}
          on:focus={focus}
          on:contextmenu={contextmenu(item.path)}
          on:click={click(item)}
        >
          <ListItem content={item.path} />
        </div>
        <p>JEFF</p>
      {/if}
    {/each}
  </div>
</div>
