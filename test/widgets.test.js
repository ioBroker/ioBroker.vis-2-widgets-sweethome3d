const helper = require('@iobroker/vis-2-widgets-testing');
const adapterName = require('../package.json').name.split('.').pop();

let page;
let browser;

describe(adapterName, () => {
    before(async function () {
        this.timeout(180_000);
        // install js-controller, web and vis-2
        await helper.startIoBroker({ widgetsSetName: adapterName });
        const result = await helper.startBrowser(process.env.CI === 'true');
        browser = result.browser;
        page = result.page;
        await helper.createProject(page);

        // open widgets
        await helper.palette.openWidgetSet(page, adapterName);
        await helper.screenshot(page, '02_widgets_opened');
    });

    it('Check all widgets', async function () {
        this.timeout(60_000);
        for (const widgetName of await helper.palette.getListOfWidgets(page, adapterName)) {
            const wid = await helper.palette.addWidget(page, widgetName);
            await helper.screenshot(page, `10_${widgetName}`);
            await helper.view.deleteWidget(page, wid);
        }
    });

    after(async function () {
        this.timeout(10_000);
        await helper.stopBrowser(browser);
        await helper.stopIoBroker();
    });
});
