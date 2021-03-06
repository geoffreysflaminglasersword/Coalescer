<script lang="typescript">
  import ListItem from "./ListItem.svelte";
  import { App, getAllTags, Menu, TFile } from "obsidian";
  import { Item, Tag, File, Link, CoalescerState, linkOpts, updateYamlProp, getYamlProp } from "./SettingsAndUtils";
  import { naturalSort } from "javascript-natural-sort";
  import { compareTwoStrings as compare } from "string-similarity";
import Coalescer from "./main";

  let rootEl: HTMLElement;

  // your script goes here
  export let items: Item[];
  export let app: App;
  export let state: CoalescerState;
  export let plugin: Coalescer;
  let firstSelection: Item;
  $: if (firstSelection == null) {
    items = items.sort((i1, i2) => {
      if (i1 instanceof File && i2 instanceof File) {
        if (i1.isinRoot && !i2.isinRoot) return -1;
        if (!i1.isinRoot && i2.isinRoot) return 1;
        let sorted = [i1.path, i2.path].sort(naturalSort);
        if (sorted[0] == i1.path) return -1;
        return 1;
      }
      if (i1 instanceof File) return 1;
      if (i2 instanceof File) return -1;
      if (i1 instanceof Tag && i2 instanceof Link) return -1;
      if (i1 instanceof Link && i2 instanceof Tag) return 1;
      return i1.basename.localeCompare(i2.basename);
    });
  }

  let prevNumSelected: number = 0;
  let [numFilesSelected, numTagsSelected, numLinksSelected] = [0, 0, 0];
  $: {
    (numFilesSelected = 0), (numTagsSelected = 0), (numLinksSelected = 0);
    items.forEach((item) => {
      if (item.selected) item instanceof Tag ? numTagsSelected++ : item instanceof File ? numFilesSelected++ : numLinksSelected++;
    });
  }

  let contextMenu = (event: MouseEvent) => {
    coalesceMenuCreate().showAtPosition({ x: event.clientX, y: event.clientY });
  };
  function reset() {
    firstSelection = null;
    lastSuggestion = 0;
    numSelected = 0;
    items = [...new Set([...selected, ...items])];
    selected.clear();
  }

  function coalesceMenuCreate() {
    const menu = new Menu(app);
    menu.addItem((item) => {
      item.setTitle("Coalesce Selected").onClick(async (e) => {
        if (numSelected < 2) return;
        await coalesce(false);
        items.forEach((val) => (val.selected = false));
        reset();
      });
    });
    if (firstSelection instanceof File) {
      menu.addItem((item) => {
        item.setTitle("Coalesce To Aliases").onClick(async (e) => {
          if (numSelected < 2) return;
          await coalesce(true);
          items.forEach((val) => (val.selected = false));
          reset();
        });
      });
    }
    //this.app.workspace.trigger("file-menu", menu, file, "link-context-menu", this.leaf);
    return menu;
  }

  async function coalesce(useAlias: boolean) {
    /* 
      if we select a tag first:
        if we have files, add the tag to each of the file's frontmatter
        if we have links/tags, replace them all with pivot.alt

      if we select a file first:
        if we have files, we merge them into the pivot, delete them, and update all links for each
        if we have links/tags, replace them all with pivot.alt
      
      if we select a link first:
        we should have links/tags, replace them all with pivot.alt
    */
    let callback: Preprocessor;

    let fileIsSelectedItem = (find: Item[], file: TFile) => find.find((item) => item instanceof File && item.path == file.path);

    if (firstSelection instanceof Tag) {
      callback = async (file, contents, find) => {
        if (!fileIsSelectedItem(find, file)) return contents;
        contents = updateYamlProp("tags", firstSelection.basename, contents);
        return contents;
      };
    } else if (firstSelection instanceof File) {
      callback = async (file, contents, find) => {
        if (file == (firstSelection as File).tfile) return null;
        // if the pivot is a file, rather than replacing links/tags in each coalesced file we merge it with the pivot
        if (!fileIsSelectedItem(find, file)) return contents;
        await (app.fileManager as any).mergeFile((firstSelection as File).tfile, file);
        return null;
      };
    }
    let activeItems = items.filter((item) => item != firstSelection && item.selected).map((item) => item);
    await findAndReplaceWith(activeItems, firstSelection, useAlias, callback);
  }
  type Preprocessor = (file: TFile, contents: string, find: Item[]) => Promise<string>;

  async function findAndReplaceWith(find: Item | Item[], replace: Item, useAlias: boolean, preprocess?: Preprocessor) {
    preprocess ??= async (fl, c, fd) => c;
    let tags: Set<string>, links: Set<string>, embeds: Set<string>;
    let aliases: string[] = [];

    const itemStrat = (item: Item) => {
      if (item instanceof Tag) return tags.has(item.altRepresentation);
      else return links.has(item.basename) || embeds.has(item.basename);
    };

    if (!Array.isArray(find)) findAndReplaceWith([find], replace, useAlias, preprocess);
    else {
      let replaceTagsLinksAndEmbeds = async (file: TFile, contents: string, updateAlias:boolean = false) => {
        if (!contents) return;
        let cache = app.metadataCache.getFileCache(file);
        (tags = new Set(getAllTags(cache))),
          (links = new Set(cache.links?.map((lc) => lc.link))),
          (embeds = new Set(cache.embeds?.map((ec) => ec.link)));

        let foundAlts = find.filter((val) => itemStrat(val));
        foundAlts.forEach((alt) => {
          if (useAlias && !(alt instanceof Tag)){
             aliases.push(alt.basename); 
            contents = contents.replace(alt.altRepresentation, `[[${firstSelection.basename}|${alt.basename}]]`);
            }
          else contents = contents.replace(alt.altRepresentation, firstSelection.altRepresentation);
        });

        let fmtags = (getYamlProp("tags", contents) as string[]) ?? [];
        let filtered = fmtags.filter((v) => find.find((i) => i.basename != v));

        if (filtered.length < fmtags.length) contents = updateYamlProp("tags", [firstSelection.basename, ...filtered], contents,true);
        if(updateAlias && aliases.length) contents = updateYamlProp("aliases", aliases, contents);
        await app.vault.modify(file, contents);
      };

      for (let file of app.vault.getMarkdownFiles()) {
        replaceTagsLinksAndEmbeds(file, await preprocess?.(file, await app.vault.cachedRead(file), find));
      }
      if (firstSelection instanceof File) 
        replaceTagsLinksAndEmbeds(firstSelection.tfile, await app.vault.cachedRead(firstSelection.tfile),useAlias);
    }
  }

  let selected = new Set<Item>(),
    numSelected = 0,
    lastSuggestion = 0;

  let click = (item: Item) =>
    ((event: MouseEvent) => {
      prevNumSelected = numSelected;
      if (item.selected) selected.add(item);
      else selected.delete(item);
      numSelected = selected.size;
      if (numSelected == 1) firstSelection = [...selected].first();
      if (!numSelected && prevNumSelected > 0) reset();
      if (numSelected) {
        let unselected = items.filter((v) => !v.selected);
        items = [];
        selected.forEach((item) => {
          unselected.sort((a, b) => (compare(a.basename, item.basename) > compare(b.basename, item.basename) ? -1 : 1));
          let resultLim: number;
          for (resultLim = Math.min(15, unselected.length - 1); resultLim > 0; resultLim--)
            if (compare(item.basename, unselected[resultLim].basename)) break;
          items = [...items, ...unselected.splice(0, resultLim)];
        });
        lastSuggestion = selected.size + items.length;
        items = [...selected, ...items, ...unselected];
      }
      if (item instanceof File && prevNumSelected < numSelected) focusFile(item, event.ctrlKey || event.metaKey);
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


  let shouldShow = (item: Item) => {
    if (item instanceof Tag) return state.showTags;
    if (item instanceof File) return firstSelection ? (firstSelection instanceof Link ? false : state.showFiles) : state.showFiles;
    if (item instanceof Link)
      return (
        state.linkView == "All" || (state.linkView == "Resolved" && item.resolved) || (state.linkView == "Unresolved" && !item.resolved)
      );
  };

  let globalSearch = (search: string) =>
    (() => {
      (app as any).internalPlugins.getPluginById("global-search")?.instance.openGlobalSearch(search);
    }).bind(search);

  /* 
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
    }).bind(item); */
</script>

<div>
  <div class="container">
    <div class="listToggles">
      <div class="toggleText">Files</div>
      <div
        class="checkbox-container {state.showFiles ? 'is-enabled' : ''}"
        on:click={() => {
          state.showFiles = !state.showFiles;
          items = items;
          plugin.saveData(false);
        }}
      />
      <div class="toggleText">Tags</div>
      <div
        class="checkbox-container {state.showTags ? 'is-enabled' : ''}"
        on:click={() => {
          state.showTags = !state.showTags;
          items = items;
          plugin.saveData(false);
        }}
      />
      <div class="toggleText">Links</div>
      <select class="dropdown" bind:value={state.linkView} on:change={() => (items = items)}>
        {#each linkOpts as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </div>
    <div class="selected-stats">Files: {numFilesSelected} Tags: {numTagsSelected} Links: {numLinksSelected}</div>
  </div>
  <div class="nav-folder mod-root list" bind:this={rootEl}>
    <div class="nav-folder-children">
      {#each items as item, idx}
        {#if (numSelected && idx == numSelected) || (lastSuggestion && lastSuggestion == idx)}
          <div class="menu-separator" />
        {/if}
        {#if shouldShow(item)}
          <div
            class="nav-file {firstSelection == item ? 'first-selected' : ''}"
            on:contextmenu={contextMenu}
            on:click={click(item)}
            on:dblclick={globalSearch(item.basename)}
          >
            <ListItem {item} on:click={() => (item.selected = !item.selected)} />
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
    margin-top: 60px;
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
  .nav-folder-children {
    overflow-y: hidden;
  }
  .dropdown {
    margin-left: 10px;
    margin-right: 10px;
    max-height: 20px;
    max-width: 10px;
  }
  .first-selected {
    background: rgba(0, 0, 0, 0.205);
  }

  /* div.first-selected .tree-item> *   {
    color: white;
    background-color: rgba(var(--background-rgb), 1); ;
  } */
</style>
