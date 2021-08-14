<script lang="ts">
  export let content: string;
  export let isFile: boolean = false;
  export let selected = false;
  let active = false;
</script>

<div
  class="{isFile ? 'nav-file-title' : 'tag-pane-tag'}{active || selected ? 'is-active' : ''} is-clickable"
  on:mouseenter={() => (active = true)}
  on:mouseleave={() => (active = false)}
  on:click
>
  <!-- set active?  -->
  <div class="nav-{isFile ? 'file-title-content' : 'tag-pane-tag-text'}">{content}</div>
</div>
