<script lang="ts">
  export let content: string;
  export let isFile: boolean = false;
  export let selected = false;
  let active = false;
</script>

<div class="tree-item" on:mouseenter={() => (active = true)} on:mouseleave={() => (active = false)} on:click>
  <div class="tree-item-self nav-file-title is-clickable {active || selected ? 'is-active' : ''}">
    {#if !isFile}
      <div class="tree-item-inner">
        <span class="tag-pane-tag-self">{content}</span>
      </div>
      <div class="tree-item-flair-outer"><span class="tag-pane-tag-count tree-item-flair">4</span></div>
    {:else}
      <div class="tree-item-inner nav-file-title-content">{content}</div>
    {/if}
  </div>
  <!-- 
  <div class="tree-item-children" style="min-height: 0px;">
    <div style="width: 1px; height: 0.1px; margin-bottom: 0px;" />
  </div> -->
</div>
<!-- 
<div class="tree-item-self tag-pane-tag is-clickable {active || selected ? 'is-active' : ''}">
    <div class="tree-item-inner">
      <div class="tag-pane-tag-text">
        <span class="tag-pane-tag-parent" />
      </div>
    </div>
    <div class="tree-item-flair-outer"><span class="tag-pane-tag-count tree-item-flair">4</span></div>
  </div> -->