<script lang="ts">
  export let content: string; 
  export let isFile: boolean = true;
  let active = false;
</script>

<div class="{isFile?'nav-file-title':'tag-pane-tag'} {active?'is-active':''} is-clickable" on:mouseenter={() => active=true} on:mouseleave={() => active=false} >
  <!-- set active?  -->
  <div class="nav-{isFile?'file-title-content':'tag-pane-tag-text'}">{content}</div>
</div>
