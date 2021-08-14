<script lang="ts">
  export let content: string; 
  export let isFile: boolean = false;
  let active = false;
</script>

<div class="nav-{isFile?'file-':''}title {active?'is-active':''}" on:mouseenter={() => active=true} on:mouseleave={() => active=false} >
  <!-- set active?  -->
  <div class="nav-{isFile?'file-':''}title-content">{content}</div>
</div>
