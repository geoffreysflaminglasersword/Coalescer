<script lang="ts">
  import ListItem from "./ListItem.svelte";
  import { App, ItemView, Menu, Notice, Setting, SuggestModal, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
  import { CoalesceListView, CoalesceSuggest } from "./ListView";
  import { FilePath } from "./Settings";
  import { onMount } from "svelte";
  let rootEl: HTMLElement;

  // your script goes here
  export let items: [FilePath | string, boolean][];
  export let app: App;
  export let leaf: WorkspaceLeaf;
  let first = true;
  let inputEl: HTMLInputElement;
  let suggest: CoalesceSuggest;

  console.log(`asdfitems`, items);

  let dragstart = (event: DragEvent) => {
    const file = app.metadataCache.getFirstLinkpathDest("" /* currentFile.path */, "");
    const dragManager = (app as any).dragManager;
    const dragData = dragManager.dragFile(event, file);
    dragManager.onDragStart(event, dragData);
  };

  let focus = () => {};
  let mouseover = (content: string) =>
    ((event: MouseEvent) => {
      app.workspace.trigger("hover-link", {
        event,
        source: CoalesceListView,
        hoverParent: rootEl,
        targetEl: event.target,
        linktext: content,
      });
    }).bind(content);

  let fileContextMenu = (file: FilePath) =>
    ((event: MouseEvent) => {
      let menu = coalesceMenuCreate(file);
      menu.addSeparator();
      const f = app.vault.getAbstractFileByPath(file.path);
      app.workspace.trigger("file-menu", menu, f, "link-context-menu", leaf);
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    }).bind(file);

  let tagContextMenu = (tag: string) =>
    ((event: MouseEvent) => {
      let menu = coalesceMenuCreate(tag);
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    }).bind(tag);

  function coalesceMenuCreate(item: string | FilePath) {
    const menu = new Menu(app);
    menu.addItem((item) => {
      item.setTitle("Coalesce Selected");
    });
    return menu;
  }

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

  onMount(() => {
    suggest = new CoalesceSuggest(app,inputEl,['asdf','aaa','fdsa']);
    inputEl.focus();
    suggest.open();
  });
</script>

<div class="nav-folder mod-root" bind:this={rootEl}>
  <div class="nav-folder-children">
    <input type="text" bind:this={inputEl} <!-- on:click={suggest.open} --> />
    {#each items as [item, selected]}
      {#if typeof item == "string"}
        <div
          class="nav-file"
          draggable={true}
          on:dragstart={dragstart}
          on:mouseover={mouseover(item)}
          on:focus={focus}
          on:contextmenu={tagContextMenu(item)}
        >
          <ListItem content={item} bind:selected on:click={() => (selected = !selected)} />
        </div>
      {:else}
        <div
          class="nav-file"
          draggable={true}
          on:dragstart={dragstart}
          on:mouseover={mouseover(item.path)}
          on:focus={focus}
          on:contextmenu={fileContextMenu(item)}
          on:click={click(item)}
        >
          <ListItem content={item.path} isFile={true} bind:selected on:click={() => (selected = !selected)} />
        </div>
      {/if}
    {/each}
  </div>
</div>
