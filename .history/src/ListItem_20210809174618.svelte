<script lang="ts">
  export let content: string;
  export let isFile: boolean = false;
  export let selected = false;
  export let tagCount: number = 0;
  let active = false;
</script>

<div class="tree-item" on:mouseenter={() => (active = true)} on:mouseleave={() => (active = false)} on:click>
  <div class="tree-item-self nav-file-title is-clickable {active || selected ? 'is-active' : ''}">
    <div class="tree-item-inner {isFile? 'nav-file-title-content':''}">{content}</div>
    {#if !isFile}
      <span class="tag-pane-tag-count ">{tagCount}</span>
    {/if}
  </div>

</div>

<style>
  .tag-pane-tag-count {
    font-size: inherit;
    padding-right: 10px;
  }
</style>
