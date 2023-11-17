import { NavItem } from "epubjs";

export const findSection = (sections: NavItem[], id: string) => {
    if (sections.length === 0) {
        return;
    }
    let prev = null;
    let current = null;
    let next = null;
    let find = false
    
    function treeRun(nodes: NavItem[]) {
        for (const n of nodes) {
            if (find && !next) {
                next = n;
                return { prev, current, next };
            }
            prev = current;
            current = n;
            if (current.id === id) {
                find = true;
                continue;
            }
            if (n.subitems) {
                const result = treeRun(n.subitems);
                if (find) {
                    if (result.next) {
                        return result;
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
            }
        }
        return { prev, current, next };
    }

    return treeRun(sections);
}