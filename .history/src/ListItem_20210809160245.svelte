<script lang="ts">
  export let content: string;
  let active = false;
</script>

<div class="nav-title" class:active on:mouseenter={() => active=true} on:mouseleave={() => active=false} >
  <!-- set active?  -->
  <div class="nav-title-content">{content}</div>
</div>
