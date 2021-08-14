<script lang="ts">
  import ListItem from "./ListItem.svelte";
  import { App, ItemView, Menu, Notice, Setting, SuggestModal, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
  import { CoalesceListView } from "./ListView";
  import { FilePath, Tag } from "./Settings";
  import { matchSorter } from "match-sorter";

  let rootEl: HTMLElement;
  type Item = FilePath | Tag;

  // your script goes here
  export let items: [Item, boolean][];
  export let app: App;
  export let leaf: WorkspaceLeaf;
  let pivot: Item;
  $: numSelected = items.reduce((sum, current) => sum + Number(current[1]), 0);
  let prevNumSelected: number = 0;
  $: console.log("sel:", numSelected);

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

  let tagContextMenu = (tag: Tag) =>
    ((event: MouseEvent) => {
      let menu = coalesceMenuCreate(tag.path);
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    }).bind(tag);

  function coalesceMenuCreate(item: string | FilePath) {
    const menu = new Menu(app);
    menu.addItem((item) => {
      item.setTitle("Coalesce Selected");
    });
    return menu;
  }

  let click = (item: Item) =>
    ((event: MouseEvent) => {
      if (numSelected == 1 && prevNumSelected == 0) {
        pivot = item;
        let filt = items.filter((v) => v[0] != pivot);
        console.log(`filt`, filt, matchSorter(filt, pivot.path, { keys: ["*.path"] }));
        //this is an inneficient way to get better fuzzy sorting, but it works for now
        items = [
          ...new Set<[Item, boolean]>([
            [pivot, true],
            ...matchSorter(filt, pivot.path, { keys: ["*.path"] }),
            // ...matchSorter(filt, pivot.path.slice(0,-2), { keys: ["*.path"] }),
            // ...matchSorter(filt, pivot.path.slice(2), { keys: ["*.path"] }),
            // ...matchSorter(filt, pivot.path.slice(0,-4), { keys: ["*.path"] }),
            // ...matchSorter(filt, pivot.path.slice(4), { keys: ["*.path"] }),
            ...filt,
          ]),
        ];
      } else if (!numSelected && prevNumSelected == 1) {
        pivot = null;
      }
      if (!(item instanceof Tag)) focusFile(item, event.ctrlKey || event.metaKey);
      prevNumSelected = numSelected;
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
    {(console.log(item instanceof Tag, item,selected), '')}
      {#if item instanceof Tag}
        <div
          class="nav-file"
          on:mouseover={mouseover(item.path)}
          on:focus={focus}
          on:contextmenu={tagContextMenu(item)}
          on:click={click(item)}
        >
          <ListItem content={item.path} bind:selected on:click={() => (selected = !selected)} tagCount={(() => { console.log(`item.count`, item.count); return item.count})()} />
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
