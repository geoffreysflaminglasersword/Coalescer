<script lang="ts">
  export let content: string;
  export let isFile: boolean = false;
  export let selected = false;
  export let tagCount: number = 0;
  export let item: any;
  let active = false;
</script>

<div class="tree-item" on:mouseenter={() => (active = true)} on:mouseleave={() => (active = false)} on:click>
  <div class="tree-item-self nav-file-title is-clickable {active || selected ? 'is-active' : ''}">
    <div class="tree-item-inner {isFile? 'nav-file-title-content':''}">{isFile?item.basename:content}</div>
    {#if !isFile}
      <div class="tag-pane-tag-count ">{tagCount}</div>
      {:else}
      <div class="tag-pane-tag-count ">{'..'+item.path.replace(/(?:((?:[^\/\\]*\/)*)([^\/\\]*)\/)*([^\/\\]+$)/,'$2').slice(-15)+'/'}</div>

    {/if}
  </div>

</div>

<style>
  .tag-pane-tag-count {
    font-size: inherit;
    padding-right: 10px;
  }
</style>
