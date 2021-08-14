<script lang="ts">
  export let content: string;
  export let isFile: boolean = false;
  export let selected = false;
  let active = false;
</script>

<div class="tree-item" on:mouseenter={() => (active = true)} on:mouseleave={() => (active = false)} on:click>
  <div class="tree-item-self nav-file-title is-clickable {active || selected ? 'is-active' : ''}">
    <div class="tree-item-inner {isFile? 'nav-file-title-content':''}">{content}</div>
    {#if !isFile}
      <div class="tree-item-flair-outer"><span class="tag-pane-tag-count tree-item-flair">4</span></div>
    {/if}
  </div>

</div>

<style>
  .tag-pane-tag-count {
    box-sizing: border-box;
    display: block;
    position: static;     
    font-size: inherit;
    padding-right: 15px;
  }
</style>
