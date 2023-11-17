import {
    ITab,
  Plugin,
  openTab,
} from "siyuan";
import Tab from './components/Tab.svelte';
import "@/index.scss";
import JSZip from "jszip";
import { addIcon } from "./utils/icon";
import { setI18n } from "./utils/i18n";

const TAB_TYPE = "epubReaderTab";

export default class EpubReaderPlugin extends Plugin {

  urlMap = new Map();

  onload() {
    setI18n(this.i18n);
    addIcon();
    const u = this.urlMap;
    this.addTab({
      type: TAB_TYPE,
      init() {
        window["JSZip"] = JSZip;
        const tab = new Tab({
            target: this.element,
            props: {
                url: this.data.url,
            }
        });
        tab.$on('metadata', (e) => {
            const metadata = e.detail.metadata;
            const tab = u.get(this.data.url);
            if (tab) {
                tab.updateTitle(metadata.title);
                u.delete(this.data.url);
            }
            // this.data.title = metadata.title && tab.updateTitle(metadata.title);
        })
      },
    });

    this.eventBus.on("open-menu-link", (event) => {
      const { detail } = event;
      if (detail.element?.dataset?.href?.endsWith(".epub")) {
        const menu = detail.menu;
        menu.addItem({
          label: this.i18n.openInEpubReader,
          icon: 'iconEpubReader',
          click: () => this.open(detail.element.dataset.href),
        });
      }
    });
  }

  open(url: string) {
    const t = openTab({
      app: this.app,
      custom: {
        icon: "iconEpubReader",
        title: this.i18n.tabDefaultTitle,
        data: {
          url,
        },
        id: this.name + TAB_TYPE,
      },
      position: 'right',
    });
    (t as any).then((tab: ITab) => {
        this.urlMap.set(url, tab);
    });
  }
}
