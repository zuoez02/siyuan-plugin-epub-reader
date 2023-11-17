import {
  Plugin,
  openTab,
} from "siyuan";
import "@/index.scss";
import "jszip";
import Epub, { Contents } from 'epubjs';
import { debounce } from 'lodash';

const TAB_TYPE = "epubReaderTab";

const addScriptSync = (path, id) => {
  if (document.getElementById(id)) {
    return false;
  }
  const xhrObj = new XMLHttpRequest();
  xhrObj.open("GET", path, false);
  xhrObj.setRequestHeader(
    "Accept",
    "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01"
  );
  xhrObj.send("");
  const scriptElement = document.createElement("script");
  scriptElement.type = "text/javascript";
  scriptElement.text = xhrObj.responseText;
  scriptElement.id = id;
  document.head.appendChild(scriptElement);
};

export default class EpubReaderPlugin extends Plugin {

  onload() {
    this.addTab({
      type: TAB_TYPE,
      init() {
        addScriptSync("/plugins/siyuan-plugin-epub-reader/zip.min.js", "zip");
        addScriptSync("/plugins/siyuan-plugin-epub-reader/epub.js", "epub");
        this.element.innerHTML = `
            <div style="height: 100%; width: 100%">
            <div id="viewer" style="height: 100%; width: 100%"></div>
            </div>
            `;
        const viewer = this.element.querySelector("#viewer");
        const book = Epub("/" + this.data.url);
        const rendition = book.renderTo(viewer, {
          width: "100%",
          height: '100%',
          flow: 'paginated',
        });


        // scroll
        const goLeft = () => rendition.prev()
        const goRight = () => rendition.next()

        const onwheel = debounce(event => {
          const { deltaX, deltaY } = event
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) goRight()
            else if (deltaX < 0) goLeft()
          } else {
            if (deltaY > 0) rendition.next()
            else if (deltaY < 0) rendition.prev()
          }
          event.preventDefault()
        }, 100, true)
        // wheel
        rendition.on('rendered', () => {
          const contents = rendition.getContents() as any;
          contents.forEach((c: Contents) => {
            c.document.removeEventListener('wheel', onwheel);
            c.document.addEventListener('wheel', onwheel);
          })
        })

        rendition.display().then(() => {

        })
      },
    });

    this.eventBus.on("open-menu-link", (event) => {
      const { detail } = event;
      if (detail.element?.dataset?.href?.endsWith(".epub")) {
        const menu = detail.menu;
        menu.addItem({
          label: "Open in Epub Reader",
          click: () => this.open(detail.element.dataset.href),
        });
      }
    });
  }

  open(url: string) {
    openTab({
      app: this.app,
      custom: {
        icon: "iconFace",
        title: "Epub Reader",
        data: {
          url,
        },
        id: this.name + TAB_TYPE,
      },
      position: 'right',
    });
  }
}
