<script lang="ts">
    import { onMount } from "svelte";
    import Epub, { Book, Contents, Location, NavItem, Rendition } from "epubjs";
    import { debounce } from "lodash";
    import type Section from "epubjs/types/section";
    import { findSection } from "@/utils/book";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    import Tree from "./Tree.svelte";
    import { i18n } from "@/utils/i18n";

    let viewer: HTMLDivElement = null;

    let book: Book = null;
    let rendition: Rendition = null;

    let currentSection: NavItem = null;
    let prevSection: NavItem = null;
    let nextSection: NavItem = null;

    let isFirstPage = false;
    let isLastPage = false;
    let isFirstSection = false;
    let isLastSection = false;

    let goLeft: () => any, goRight: () => any;

    $: currentTitle = currentSection ? currentSection.label : "";

    let sections: NavItem[] = [];

    const jumpTo = (section: NavItem) => {
        rendition.display(section.href);
    };

    const jumpToNextSection = () => {
        nextSection && jumpTo(nextSection);
    };

    const jumpToPrevSection = () => {
        prevSection && jumpTo(prevSection);
    };

    onMount(() => {
        book = Epub("/" + url);
        rendition = book.renderTo(viewer, {
            width: "100%",
            height: "100%",
            flow: "paginated",
        });

        // scroll
        goLeft = () =>
            (book as Book & { package: any }).package.metadata.direction ===
            "rtl"
                ? rendition.next()
                : rendition.prev();
        goRight = () =>
            (book as Book & { package: any }).package.metadata.direction ===
            "rtl"
                ? rendition.prev()
                : rendition.next();

        const onwheel = debounce(
            (event) => {
                const { deltaX, deltaY } = event;
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) goRight();
                    else if (deltaX < 0) goLeft();
                } else {
                    if (deltaY > 0) rendition.next();
                    else if (deltaY < 0) rendition.prev();
                }
                event.preventDefault();
            },
            100,
            true
        );
        rendition.on("rendered", (section: Section) => {
            /**
             * Wheel event listener
             */
            const contents = rendition.getContents() as any;
            contents.forEach((c: Contents) => {
                c.document.removeEventListener("wheel", onwheel);
                c.document.addEventListener("wheel", onwheel);
            });
            /**
             * Navigation
             */
            const current =
                book.navigation && book.navigation.get(section.href);
            if (current) {
                currentSection = current;
                const { prev, next } = findSection(sections, current.id);
                nextSection = next;
                prevSection = prev;
                isFirstSection = !prevSection;
                isLastSection = !nextSection;
            }
        });

        rendition.on("relocated", function (location: Location) {
            /**
             * page position
             */
            isLastPage = location.atEnd;
            isFirstPage = location.atStart;
        });

        book.loaded.metadata.then((metadata) => {
            dispatch("metadata", { metadata });
        });

        book.loaded.navigation.then(function (toc) {
            sections = [];
            toc.forEach((chapter) => {
                sections.push(chapter);
                return {};
            });
        });

        rendition.display();
    });

    export let url;
</script>

<div class="fn__flex-1 fn__flex full-height">
    <div class="epub-dock">
        <Tree
            {sections}
            {currentSection}
            on:jump={(e) => jumpTo(e.detail.section)}
        />
    </div>
    <div class="fn__flex-column fn__flex-1 fn__flex">
        <div class="toolbar-top">
            <button
                class="toolbar-btn b3-button b3-button--outline prev-section"
                disabled={isFirstSection}
                on:click={jumpToPrevSection}>{i18n.prevSection}</button
            >
            <button
                class="toolbar-btn b3-button b3-button--outline prev-page"
                disabled={isFirstPage}
                on:click={goLeft}>{i18n.prevPage}</button
            >
            <div class="epub-title">{currentTitle}</div>
            <button
                class="toolbar-btn b3-button b3-button--outline next-page"
                disabled={isLastPage}
                on:click={goRight}>{i18n.nextPage}</button
            >
            <button
                class="toolbar-btn b3-button b3-button--outline next-section"
                disabled={isLastSection}
                on:click={jumpToNextSection}>{i18n.nextSection}</button
            >
        </div>
        <div id="viewer" bind:this={viewer} style="height: 100%; width: 100%" />
        <!-- <div class="toolbar-bottom" /> -->
    </div>
</div>
