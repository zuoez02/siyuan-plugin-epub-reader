let stylesheet: string;
let styleLink = '';
let themeLink = '';

export const getStyleLink = () => styleLink;
export const getThemeLink = () => themeLink;

export const getStylesheet = () => stylesheet;

export const loadStyle = () => {
    if (stylesheet) {
        return stylesheet;
    }
    let style = '';
    const sheets = document.querySelectorAll('link[rel="stylesheet"]');
    for (const sheet of sheets) {
        const href = sheet.getAttribute('href');
        if (href.startsWith('base.') && href.endsWith('.css')) {
            style = href;
        }
    }
    styleLink = `/stage/build/app/${style}`;
    themeLink = document.querySelector('link#themeDefaultStyle')?.getAttribute('href');
}