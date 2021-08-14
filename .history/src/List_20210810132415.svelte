<script lang="ts">
  import ListItem from "./ListItem.svelte";
  import { App, Menu, WorkspaceLeaf } from "obsidian";
  import { CoalesceListView } from "./ListView";
  import { FilePath, Tag } from "./Settings";
  import { matchSorter } from "match-sorter";
  import { naturalSort } from "javascript-natural-sort";

  let rootEl: HTMLElement;
  type Item = FilePath | Tag;

  // your script goes here
  export let items: [Item, boolean][];
  export let app: App;
  export let leaf: WorkspaceLeaf;
  let pivot: Item;
  $: if (pivot == null) {
    items = items.sort((a, b) => {
      let i1 = a[0];
      let i2 = b[0];
      if (i1 instanceof Tag && !(i2 instanceof Tag)) return -1;
      if (i2 instanceof Tag && !(i1 instanceof Tag)) return 1;
      else if (i1 instanceof Tag && i2 instanceof Tag) return i1.basename.localeCompare(i2.basename);
      else if (!(i1 instanceof Tag) && !(i2 instanceof Tag)) {
        let sorted = [i1.path, i2.path].sort(naturalSort);
        if (sorted[0] == i1.path) return -1;
        return 1;
      }
    });
  }
  let lastSortResultIndex: number;
  let showFiles = true;
  let showTags = true;
  $: numSelected = items.reduce((sum, current) => sum + Number(current[1]), 0);
  $: numTagsSelected = items.reduce((sum, current) => (current[0] instanceof Tag ? sum + Number(current[1]) : sum), 0);
  $: numFilesSelected = numSelected - numTagsSelected;
  let prevNumSelected: number = 0;

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
      let menu = coalesceMenuCreate(tag.basename);
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
        //this is an inneficient way to get better fuzzy sorting, but it works for now
        console.log(
          `pivot.basename.split(/[.\-, ;_](?=[A-Z])?/)`,
          pivot.basename.split(/[.\-, ;_]/).concat(pivot.basename.split(/(?=[A-Z])/))
        );
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
        console.log(`lastSortResultIndex`, lastSortResultIndex);
        items = [...new Set([...items, ...filt])];
      } else if (!numSelected && prevNumSelected == 1) {
        pivot = null;
        lastSortResultIndex = null;
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

<div class="container">
  <div class="listToggles">
    <div class="toggleText">Show Files</div>
    <div class="checkbox-container {showFiles ? 'is-enabled' : ''}" on:click={() => (showFiles = !showFiles)}/>
    <div class="toggleText">Show Tags</div>
    <div class="checkbox-container {showTags ? 'is-enabled' : ''}" on:click={() => (showTags = !showTags)} />
  </div>
  <div class='selected-stats'>Files selected: {numFilesSelected} Tags selected: {numTagsSelected}</div>
</div>
<div class="nav-folder mod-root list" bind:this={rootEl}>
  <div class="nav-folder-children">
    {#each items as [item, selected], idx}
      {#if idx == lastSortResultIndex}
        <div class="menu-separator" />
      {/if}
      {#if item instanceof Tag && showTags}
        <div
          class="nav-file"
          on:mouseover={mouseover(item.basename)}
          on:focus={focus}
          on:contextmenu={tagContextMenu(item)}
          on:click={click(item)}
        >
          <ListItem
            content={item.basename}
            bind:selected
            on:click={() => (selected = !selected)}
            tagCount={item.count}
          />
        </div>
      {:else if !(item instanceof Tag) && showFiles}
        <div
          class="nav-file"
          on:mouseover={mouseover(item.path)}
          on:focus={focus}
          on:contextmenu={fileContextMenu(item)}
          on:click={click(item)}
        >
          <ListItem content={item.path} isFile={true} {item} bind:selected on:click={() => (selected = !selected)} />
        </div>
      {/if}
    {/each}
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
    margin-top: 30px;
    overflow-y: scroll;
  }
  .container{
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
.selected-stats{
  margin-left: 10px;
  display: flex;
    justify-content: flex-end;
}
</style>
