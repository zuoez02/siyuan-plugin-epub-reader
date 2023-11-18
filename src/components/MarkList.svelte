<script lang="ts">
    import { Service } from "@/service";
    import { Mark } from "@/type";
    import { Rendition } from "epubjs";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    const goto = (cfi: string) => rendition.display(cfi);

    const deleteMark = (mark: Mark) => {
        service.removeMark(mark.id);
        rendition.annotations.remove(mark.cfi, "highlight");
        dispatch("deleteMark", {
            mark,
        });
    };

    export let service: Service;
    export let marks: Mark[];
    export let rendition: Rendition;
</script>

<div class="mark-list">
    {#each marks as mark}
        <div class="mark">
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a on:click={() => goto(mark.cfi)}>
                {mark.content}
            </a>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <svg
                style="font-size: 14px;height: 14px; width: 14px; display: inline;"
                on:click={() => deleteMark(mark)}
                ><use xlink:href="#iconTrashcan" /></svg
            >
        </div>
    {/each}
</div>
