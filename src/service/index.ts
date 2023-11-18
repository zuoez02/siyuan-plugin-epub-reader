import { Mark } from "@/type";
import EpubReaderPlugin from "..";
import md5 from 'md5';

export class Service {
    private md5;
    public defaultConfig: {
        href: string,
        marks: Mark[],
        currentCfi: string,
        fontSize: string,
        theme: string,
    } = {
        href: '',
        marks: [],
        currentCfi: '',
        fontSize: '',
        theme: '',
    }
    constructor(private href: string, private plugin: EpubReaderPlugin) {
        this.initStorage();
        this.md5 = this.generateMd5(href);
        this.defaultConfig.href = href;
    }

    generateMd5(href: string) {
        return md5(href);      
    }

    async initStorage() {
        if (!this.md5) {
            this.createStorage();
        } else {
            const config = await this.plugin.loadData(`${this.md5}.json`);
            Object.assign(this.defaultConfig, config);
        }
    }

    async createStorage() {
        await this.plugin.saveData(`${this.md5}.json`, this.defaultConfig);
    }

    async updateStorage() {
        await this.plugin.saveData(`${this.md5}.json`, this.defaultConfig);
    }

    async updateCurrentCfi(cfi: string) {
        this.defaultConfig.currentCfi = cfi;
        await this.updateStorage();
    }

    getCurrentCfi() {
        return this.defaultConfig.currentCfi;
    }

    getHref() {
        return this.href;
    }

    getMarks() {
        return this.defaultConfig.marks;
    }

    insertMark(mark: Mark) {
        this.defaultConfig.marks.push(mark);
        return this.updateStorage();
    }

    removeMark(id: string) {
        const i = this.defaultConfig.marks.findIndex((m) => m.id === id);
        if (i >= 0) {
            this.defaultConfig.marks.splice(i, 1);
        }
        return this.updateStorage();
    }
}