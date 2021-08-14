<script lang="ts">
  export let content: string;
  let active = false;
</script>

<div class="nav-file-title" class:active on:mouseenter={() => active=true} on:mouseleave={() => active=false} >
  <!-- set active?  -->
  <div class="nav-file-title-content">{content}</div>
</div>
