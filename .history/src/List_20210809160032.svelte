<script lang="ts">
  import ListItem from "./ListItem.svelte";
  import { App, ItemView, Menu, Notice, TFile, WorkspaceLeaf } from "obsidian";
  import { CoalesceListView } from "./ListView";
  import { FilePath } from "./Settings";
  let rootEl: HTMLElement;

  // your script goes here
  export let items: (FilePath | string)[];
  export let app: App;

  console.log(`asdfthis.items`, items);

  let dragstart = (event: DragEvent) => {
    const file = this.app.metadataCache.getFirstLinkpathDest("" /* currentFile.path */, "");
    const dragManager = (this.app as any).dragManager;
    const dragData = dragManager.dragFile(event, file);
    dragManager.onDragStart(event, dragData);
  };

  let focus = () => {};
  let mouseover = (content: string) =>
    ((event: MouseEvent) => {
      this.app.workspace.trigger("hover-link", {
        event,
        source: CoalesceListView,
        hoverParent: rootEl,
        targetEl: event.target,
        linktext: content,
      });
    }).bind(content);

  let contextmenu = (content: string) =>
    ((event: MouseEvent) => {
      const menu = new Menu(this.app);
      const file = this.app.vault.getAbstractFileByPath(content);
      this.app.workspace.trigger("file-menu", menu, file, "link-context-menu", this.leaf);
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    }).bind(content);

  let click = (fp: FilePath) =>
    ((event: MouseEvent) => {
      focusFile(fp, event.ctrlKey || event.metaKey);
    }).bind(fp);

  let focusFile = (fp: FilePath, shouldSplit = false): void => {
    const targetFile = app.vault.getFiles().find((f) => f.path === fp.path);
    if (targetFile) {
      let leaf = app.workspace.getMostRecentLeaf();

      const createLeaf = shouldSplit || leaf.getViewState().pinned;
      if (createLeaf) {
        leaf = app.workspace.createLeafBySplit(leaf);
      }
      leaf.openFile(targetFile);
    }
    
  };

  let cats = [
		{ id: 'J---aiyznGQ', name: 'Keyboard Cat' },
		{ id: 'z_AbfPXTKms', name: 'Maru' },
		{ id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat' }
	];
</script>

<div class="nav-folder mod-root" bind:this={rootEl}>
  <div class="nav-folder-children">
    {#each cats as { id, name }, i}
      <li>
        <a target="_blank" href="https://www.youtube.com/watch?v={id}">
          {i + 1}: {name}
        </a>
      </li>
    {/each}

    {#each items as item,idx}
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
      {/if}
    {/each}
  </div>
</div>
