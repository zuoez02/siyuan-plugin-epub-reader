<script lang="ts">
    import { onMount } from "svelte";
    import Epub, { Book, Contents, Location, NavItem, Rendition } from "epubjs";
    import { debounce } from "lodash";
    import type Section from "epubjs/types/section";
    import { findSection } from "@/utils/book";
    import { createEventDispatcher } from "svelte";

    import Tree from "./Tree.svelte";
    import { i18n } from "@/utils/i18n";
    import { Service } from "@/service";
    import Config from "./Config.svelte";
    import { getStyleLink, getThemeLink } from "@/utils/style";
    import { Mark } from "@/type";
    import MarkList from "./MarkList.svelte";
    import { v4 as uuidv4 } from "uuid";
    import { PLUGIN_NAME, TAB_TYPE } from "@/utils/constants";

    type DockType = "Sections" | "Config" | "Marks" | "";

    const dispatch = createEventDispatcher();
    let currentLocationCfi = "";

    let openDock = true;
    let openDockType: DockType = "Sections";

    let title = "";

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

    let marks: Mark[] = [];

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

    const toggleMenu = (dockType: DockType) => {
        if (!openDock) {
            openDock = true;
            openDockType = dockType;
        } else {
            if (openDockType === dockType) {
                openDock = false;
                openDockType = "";
            } else {
                openDockType = dockType;
            }
        }
    };
    const toggleSections = () => toggleMenu("Sections");
    const toggleConfig = () => toggleMenu("Config");
    const toggleBookMarks = () => toggleMenu("Marks");

    const handleDeleteMark = (e) => {
        const i = marks.findIndex((m) => {
            console.log(m.id, e.detail.mark.id);
            return m.id === e.detail.mark.id;
        });
        if (i >= 0) {
            marks.splice(i, 1);
            marks = [...marks];
        }
    };

    const copyToClipboard = (mark: Mark) => {
        const pluginName = PLUGIN_NAME;
        const tabType = TAB_TYPE;
        const link = `siyuan://plugins/${pluginName}${tabType}?icon=iconEpubReader&title=${title}&data=${JSON.stringify(
            { url: service.getHref(), cfi: mark.cfi }
        )}`;
        navigator.clipboard.writeText(`[${mark.content}](${encodeURI(link)})`);
    };

    const refreshHighlights = () => {
        marks.forEach((m) => {
            rendition.annotations.remove(m.cfi, 'highlight');
            rendition.annotations.add('highlight', m.cfi);
        })
    }

    const ob = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
            const { width ,height } = entry.contentRect;
            rendition.started.then(() => {
                rendition.resize(width, height);
                refreshHighlights();
            });
        });
    })

    onMount(() => {
        ob.observe(viewer)
        book = Epub("/" + service.getHref());
        currentLocationCfi = cfi || service.getCurrentCfi();
        marks = service.getMarks();
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

        /**
         * init config
         */
        const { fontSize } = service.defaultConfig;
        rendition.themes.fontSize(fontSize);
        rendition.themes.default(getThemeLink());

        rendition.started.then(() => {
            marks.forEach((mark) => {
                rendition.annotations.add("highlight", mark.cfi);
            });
        });

        rendition.on("rendered", (section: Section) => {
            /**
             * Wheel event listener
             */
            const contents = rendition.getContents() as any;
            contents.forEach((c: Contents) => {
                c.document.removeEventListener("wheel", onwheel);
                c.document.addEventListener("wheel", onwheel);
                const html = c.document.querySelector("html");
                const parentHtml = document.querySelector("html");
                html.setAttribute(
                    "data-theme-mode",
                    parentHtml.getAttribute("data-theme-mode")
                );
                if (!c.document.getElementById("siyuan-style-link")) {
                    const link = c.document.createElement("link");
                    link.rel = "stylesheet";
                    link.id = "siyuan-style-link";
                    link.href = getStyleLink();
                    c.document.head.appendChild(link);
                }
                if (!c.document.getElementById("siyuan-theme-link")) {
                    const link = c.document.createElement("link");
                    link.rel = "stylesheet";
                    link.id = "siyuan-theme-link";
                    link.href = getThemeLink();
                    c.document.head.appendChild(link);
                }
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
            /**
             * Remember current location for reopen
             */
            currentLocationCfi = location.start.cfi;
            service.updateCurrentCfi(currentLocationCfi);
        });

        book.loaded.metadata.then((metadata) => {
            title = metadata.title;
            dispatch("metadata", { metadata });
        });

        book.loaded.navigation.then(function (toc) {
            sections = [];
            toc.forEach((chapter) => {
                sections.push(chapter);
                return {};
            });
        });

        /**
         * Fix current location lost after resizing
         *
         * https://github.com/johnfactotum/epubjs-tips
         */
        let location: string;
        let justResized = false;
        let correcting = false;
        rendition.on("relocated", (lo: Location) => {
            if (!justResized) {
                if (!correcting) {
                    location = lo.start.cfi;
                } else {
                    correcting = false;
                }
            } else {
                justResized = false;
                correcting = true;
                rendition.display(location);
            }
        });
        rendition.on("resized", () => {
            justResized = true;
        });

        if (currentLocationCfi) {
            rendition.display(currentLocationCfi);
        } else {
            rendition.display();
        }

        /**
         * Marks
         */
        rendition.on("selected", function (cfiRange, contents) {
            rendition.annotations.highlight(cfiRange, {}, (e) => {
                console.log("highlight clicked", e.target);
            });
            contents.window.getSelection().removeAllRanges();
        });
        rendition.themes.default({
            "::selection": {
                background: "rgba(255,255,0, 0.3)",
            },
            ".epubjs-hl": {
                fill: "yellow",
                "fill-opacity": "0.3",
                "mix-blend-mode": "multiply",
            },
        });

        // Illustration of how to get text from a saved cfiRange
        rendition.on("selected", function (cfiRange: string) {
            book.getRange(cfiRange).then(function (range) {
                const mark: Mark = {
                    id: uuidv4(),
                    cfi: cfiRange,
                    content: range.toString(),
                    type: 1,
                    href: service.defaultConfig.href,
                };
                marks.push(mark);
                marks = marks;
                service.insertMark(mark);
                copyToClipboard(mark);
            });
        });
    });

    export let service: Service;
    export let cfi = '';
</script>

<div class="fn__flex-1 fn__flex full-height">
    <div class="epub-dock" class:fn__none={!openDock}>
        {#if openDock && openDockType === "Sections"}
            <Tree
                {sections}
                {currentSection}
                on:jump={(e) => jumpTo(e.detail.section)}
            />
        {:else if openDock && openDockType === "Config"}
            <Config {rendition} {service} />
        {:else if openDock && openDockType === "Marks"}
            <MarkList
                {rendition}
                {service}
                {marks}
                on:deleteMark={handleDeleteMark}
            />
        {/if}
    </div>
    <div class="fn__flex-column fn__flex-1 fn__flex">
        <div class="toolbar-top">
            <div class="left-corner-btns">
                <div
                    class="left-corner-btn sections"
                    class:selected={openDockType === "Sections"}
                >
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <svg on:click={toggleSections}><use href="#iconMenu" /></svg
                    >
                </div>
                <div
                    class="left-corner-btn config"
                    class:selected={openDockType === "Config"}
                >
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <svg on:click={toggleConfig}
                        ><use href="#iconSettings" /></svg
                    >
                </div>
                <div
                    class="left-corner-btn marks"
                    class:selected={openDockType === "Marks"}
                >
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <svg on:click={toggleBookMarks}>
                        <use href="#iconBookmark" /></svg
                    >
                </div>
            </div>
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
