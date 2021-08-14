<script lang="ts">
  import ListItem from "./ListItem.svelte";
  import { App, Menu, WorkspaceLeaf } from "obsidian";
  import { CoalesceListView } from "./ListView";
  import { HasCount, Item, Tag, File, UnresolvedLink } from "./Settings";
  import { matchSorter } from "match-sorter";
  import { naturalSort } from "javascript-natural-sort";
  import { tick } from 'svelte';

  let rootEl: HTMLElement;

  // your script goes here
  export let items: [Item, boolean][];
  export let app: App;
  let pivot: Item;
  $: if (pivot == null) {
    items = items.sort((a, b) => {
      let i1 = a[0];
      let i2 = b[0];

      if (i1 instanceof File && i2 instanceof File) {
        if (i1.isinRoot && !i2.isinRoot) return -1;
        if (!i1.isinRoot && i2.isinRoot) return 1;
        let sorted = [i1.path, i2.path].sort(naturalSort);
        if (sorted[0] == i1.path) return -1;
        return 1;
      }

      if (i1 instanceof File) return 1;
      if (i2 instanceof File) return -1;
      return i1.basename.localeCompare(i2.basename);
    });
  }
  let lastSortResultIndex: number;
  let [showFiles, showLinks, showTags] = [true, true, true];
  let prevNumSelected: number = 0;
  let [numFilesSelected, numTagsSelected, numLinksSelected, numSelected] = [0, 0, 0, 0];

  $: {
    (numFilesSelected = 0), (numTagsSelected = 0), (numLinksSelected = 0), (numSelected = 0);
    items.reduce((numSelected, current) => {
      if (current[1]) {
        current[0] instanceof Tag
          ? numTagsSelected++
          : current[0] instanceof File
          ? numFilesSelected++
          : numLinksSelected++;
        console.log("Selected:", numFilesSelected, numTagsSelected, numLinksSelected, numSelected);
        return numSelected++;
      }
      return numSelected;
    }, 0);
  }

  let contextMenu = (event: MouseEvent) => {
    coalesceMenuCreate().showAtPosition({ x: event.clientX, y: event.clientY });
  };

  function coalesceMenuCreate() {
    const menu = new Menu(app);
    menu.addItem((item) => {
      item.setTitle("Coalesce Selected").onClick((e) => {
        if (numSelected < 2) return;
        if (numFilesSelected) coalesceToLinks();
        else if (numTagsSelected) coalesceTags();
        items.forEach((val) => (val[1] = false));
      });
    });
    return menu;
  }
  function coalesceToLinks() {}

  function coalesceTags() {}

  let click = (item: Item) =>
    ((event: MouseEvent) => {
      if (numSelected == 1) {
        pivot = items.find((val) => val[1])[0];
        let filt = items.filter((v) => v[0] != pivot);
        //this is an inneficient (and disgusting) way to get better fuzzy sorting, but it works for now
        let tokens = pivot.basename.split(/[.\-, ;_]/).concat(pivot.basename.split(/(?=[A-Z])/));
        items = [
          ...new Set<[Item, boolean]>([
            [pivot, true],
            ...matchSorter(filt, pivot.basename, { keys: ["*.basename"] }),
            ...tokens.map((token) => matchSorter(filt, token, { keys: ["*.basename"] })).flat(1),
            ...[1, 3, 5, 8, 13]
              .map((i) =>
                tokens
                  .map((token) =>
                    Math.max(i * 2, 5) <= token.length
                      ? matchSorter(filt, token.slice(0, -i), { keys: ["*.basename"] })
                      : []
                  )
                  .flat(1)
              )
              .flat(1),
            ...[1, 3, 5, 8, 13]
              .map((i) =>
                tokens
                  .map((token) =>
                    Math.max(i * 2, 5) <= token.length
                      ? matchSorter(filt, token.slice(i), { keys: ["*.basename"] })
                      : []
                  )
                  .flat(1)
              )
              .flat(1),
          ]),
        ].slice(0, 30); //limit results
        lastSortResultIndex = items.length;
        items = [...new Set([...items, ...filt])];
      } else if (!numSelected && prevNumSelected == 1) {
        pivot = null;
        lastSortResultIndex = null;
      }
      if (item instanceof File) focusFile(item, event.ctrlKey || event.metaKey);

      prevNumSelected = numSelected;
    }).bind(item);

  let focusFile = (file: File, shouldSplit = false): void => {
    const targetFile = app.vault.getFiles().find((f) => f.path === file.path);
    if (targetFile) {
      let leaf = app.workspace.getMostRecentLeaf();

      const createLeaf = shouldSplit || leaf.getViewState().pinned;
      if (createLeaf) {
        leaf = app.workspace.createLeafBySplit(leaf);
      }
      leaf.openFile(targetFile);
    }
  };

  let shouldShow = (item: Item) =>{
    console.log(item instanceof File && showFiles,item instanceof Tag && showTags,item instanceof UnresolvedLink && showLinks)
    return (item instanceof File && showFiles) || (item instanceof Tag && showTags) || (item instanceof UnresolvedLink && showLinks);}
</script>

<div>
  <div class="container">
    <div class="listToggles">
      <div class="toggleText">Show Files</div>
      <div class="checkbox-container {showFiles ? 'is-enabled' : ''}" on:click={async () => {await tick();showFiles = !showFiles;}} />
      <div class="toggleText">Show Tags</div>
      <div class="checkbox-container {showTags ? 'is-enabled' : ''}" on:click={async () => {await tick();showTags = !showTags;}} />
      <div class="toggleText">Show Links</div>
      <div class="checkbox-container {showLinks ? 'is-enabled' : ''}" on:click={async () => {await tick();showLinks = !showLinks;}} />
    </div>
    <div class="selected-stats">Files: {numFilesSelected} Tags: {numTagsSelected} Links: {numLinksSelected}</div>
  </div>
  <div class="nav-folder mod-root list" bind:this={rootEl}>
    <div class="nav-folder-children">
      {#each items as [item, selected], idx}
        {#if idx == lastSortResultIndex}
          <div class="menu-separator" />
        {/if}
        {#if shouldShow(item)}
          <div class="nav-file" on:contextmenu={contextMenu} on:click={click(item)}>
            <ListItem {item} bind:selected on:click={() => (selected = !selected)} />
          </div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .checkbox-container {
    max-height: 15px;
    margin-right: 20px;
    padding-right: 20px;
    margin-left: 10px;
  }
  .checkbox-container::after {
    max-height: 15px;
    margin-right: 20px;
  }
  .listToggles {
    display: flex;
    justify-content: flex-end;
  }
  .toggleText {
    white-space: nowrap;
  }
  .list {
    margin-top: 50px;
    overflow-y: scroll;
  }
  .container {
    width: 100%;
    position: absolute;
    top: 0px;
    right: 10px;
    margin-top: 0px;
    padding-top: 10px;
    padding-bottom: 10px;

    overflow: hidden;
    background: rgba(var(--background-rgb), 1);
    z-index: 100;
  }
  .selected-stats {
    margin-top: 5px;
    margin-right: 20px;
    display: flex;
    justify-content: flex-end;
  }
</style>
