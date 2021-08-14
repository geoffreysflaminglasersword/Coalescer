<script lang="ts">
  import ListItem from "./ListItem.svelte";
  import { App, ItemView, Menu, Notice, Setting, SuggestModal, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
  import { CoalesceListView } from "./ListView";
  import { FilePath } from "./Settings";
  import { matchSorter } from "match-sorter";

  let rootEl: HTMLElement;

  // your script goes here
  export let items: [FilePath | string, boolean][];
  export let app: App;
  export let leaf: WorkspaceLeaf;
  let pivot:string|FilePath;
  $: numSelected = items.reduce((sum,current) => sum + Number(current[1]),0);
  $:console.log('sel:',numSelected);


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

  let click = (item: FilePath|string) =>
    ((event: MouseEvent) => {
      if(numSelected == 1) pivot = item;
      else if (!numSelected) pivot = null;
      if(pivot){
        let piv = typeof pivot == 'string' ? pivot:pivot.path;
        items =[[pivot,true],... matchSorter(items.filter(v => v[0] == pivot),piv,{keys:['0']})];

        if(typeof item == 'string'){
        }else{
          focusFile(item, event.ctrlKey || event.metaKey);
  
        }
      }
    }).bind(item);

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

</script>

<div class="nav-folder mod-root" bind:this={rootEl}>
  <div class="nav-folder-children">
    {#each items as [item, selected]}
      {#if typeof item == "string"}
        <div
          class="nav-file"
          on:mouseover={mouseover(item)}
          on:focus={focus}
          on:contextmenu={tagContextMenu(item)}
          on:click={click(item)}
        >
          <ListItem content={item} bind:selected on:click={() => (selected = !selected)} />
        </div>
      {:else}
        <div
          class="nav-file"
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
