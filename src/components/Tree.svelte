<script lang="ts">
    import type { NavItem } from "epubjs";
    import { createEventDispatcher } from "svelte";

    export let sections: NavItem[];
    export let currentSection: NavItem;
    export let level = 0;

    const dispatch = createEventDispatcher();

    const jumpTo = (section: NavItem) => {
        dispatch("jump", { section });
    };
</script>

{#each sections as section}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    
    <div
        class:current-section={currentSection === section}
        class={`epub-dock-item dock-level-${level}`}
        data-nav-id={section.id}
        on:click={() => jumpTo(section)}
    >
        {section.label}
    </div>
    {#if section.subitems}
        <svelte:self
            level={level + 1}
            sections={section.subitems}
            currentSection={currentSection}
            on:jump={(e) => jumpTo(e.detail.section)}
        />
    {/if}
{/each}
