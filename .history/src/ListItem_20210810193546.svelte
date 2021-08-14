<script lang="ts">
  import { Item, File, HasCount, Tag } from "./Settings";
  export let selected = false;
  export let item: Item;
  let active = false;
  const shortPathMaxLength = 15;
  $: tagCount = (item as any)?.count;
  $: isFile = item instanceof File;
  $: isTag = item instanceof Tag;
  let getShortPath = () =>
    `..${(item as File).path
      .replace(/(?:((?:[^\/\\]*\/)*)([^\/\\]*)\/)*([^\/\\]+$)/, "$2")
      .slice(-shortPathMaxLength)}/`;
</script>

<div class="tree-item" on:mouseenter={() => (active = true)} on:mouseleave={() => (active = false)} on:click>
  <div class="tree-item-self nav-file-title is-clickable {active || selected ? 'is-active' : ''}">
    <div class="tree-item-inner {isFile ? 'nav-file-title-content' : ''}">{item.basename}</div>
    <div class="tag-pane-tag-count ">{isFile ? getShortPath() : (isTag? '# ':'[] ') + tagCount}</div>
  </div>
</div>

<style>
  .tag-pane-tag-count {
    font-size: inherit;
    padding-right: 10px;
  }
</style>
