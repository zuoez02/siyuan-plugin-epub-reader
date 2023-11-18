<script lang="ts">
    import { Service } from "@/service";
    import { Rendition } from "epubjs";
    import { i18n } from '@/utils/i18n';
    import { onMount } from "svelte";

    let currentFontSize;

    const fontSizes = ["small", "smaller", "medium", "large", "larger"];

    const fontSizeName = {
        'smaller': i18n.smaller,
        'small': i18n.small,
        'medium': i18n.medium,
        'large': i18n.large,
        'larger': i18n.larger,
    };

    const fontSize = (f: string) => {
        currentFontSize = f;
        rendition.themes.fontSize(f);
        service.defaultConfig.fontSize = f;
        service.updateStorage();
    };

    onMount(() => {
        currentFontSize = service.defaultConfig.fontSize;
    })

    export let rendition: Rendition;
    export let service: Service;
</script>

<div class="epub-books-config">
    <div class="font-size">
        <h4 style="margin-bottom: 12px;">{i18n.fontSizeTitle}</h4>
        {#each fontSizes as f}
            <button style="margin-right: 4px" class={`b3-button ${f === currentFontSize ? '' : 'b3-button--outline'} font-button font-${f}`} on:click={() => fontSize(f)}
                >{fontSizeName[f]}</button
            >
        {/each}
    </div>
</div>
