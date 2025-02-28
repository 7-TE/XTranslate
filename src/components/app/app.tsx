//-- Main window app (options page)

import "./app.scss";
import "../../packages.setup";
import * as React from 'react';
import { createRoot } from "react-dom/client"
import { makeObservable, observable, reaction } from "mobx";
import { observer } from "mobx-react";
import { cssNames } from "../../utils/cssNames";
import { getManifest } from "../../extension";
import { settingsStore } from '../settings/settings.storage'
import { themeStore } from "../theme-manager/theme.storage";
import { Footer } from '../footer'
import { Spinner } from "../spinner";
import { Tab, Tabs } from "../tabs";
import { Icon } from "../icon";
import { AppRateDialog } from "./app-rate.dialog";
import { Notifications } from "../notifications";
import { ExportImportSettingsDialog } from "../export-import-settings";
import { defaultPageId, getParam, navigate, PageId } from "../../navigation";
import { pageManager } from "./page-manager";
import { getMessage, i18nInit } from "../../i18n";

@observer
export class App extends React.Component {
  static manifest = getManifest();
  static pages: PageId[] = ["settings", "theme", "translate", "history"];

  @observable showImportExportDialog = false;

  constructor(props: object) {
    super(props);
    makeObservable(this);
  }

  static async init() {
    document.title = App.manifest.name;

    var rootElem = document.getElementById('app');
    var rootNode = createRoot(rootElem);
    rootNode.render(<Spinner center/>); // show loading indicator

    // wait for dependent data before render
    await Promise.all([
      i18nInit(),
      settingsStore.ready,
      themeStore.ready,
    ]);

    reaction(() => settingsStore.data.useDarkTheme, App.switchTheme, {
      fireImmediately: true,
    });

    rootNode.render(<App/>);
  }

  static switchTheme(isDark: boolean) {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }

  detachWindow = () => {
    chrome.windows.create({
      url: location.href,
      focused: true,
      width: 600,
      height: 700,
      left: 25,
      top: 25,
      type: "popup"
    });
  }

  onTabsChange = async (page: PageId) => {
    await navigate({ page });
    window.scrollTo(0, 0);
  }

  render() {
    const { name, version } = App.manifest;
    const { useDarkTheme } = settingsStore.data;
    const pageId = getParam("page", defaultPageId);
    const { Page } = pageManager.getComponents(pageId);

    return (
      <div className="App">
        <header className="flex gaps">
          <div className="app-title box grow">
            {name} <sup className="app-version">{version}</sup>
          </div>
          <Icon
            svg="moon"
            tooltip={{ nowrap: true, children: getMessage("use_dark_theme") }}
            className={cssNames("dark-theme-icon", { active: useDarkTheme })}
            onClick={() => settingsStore.data.useDarkTheme = !useDarkTheme}
          />
          <Icon
            material="open_in_new"
            tooltip={{ nowrap: true, children: getMessage("open_in_window") }}
            onClick={this.detachWindow}
          />
          <Icon
            material="import_export"
            tooltip={{ nowrap: true, children: getMessage("import_export_settings") }}
            onClick={() => this.showImportExportDialog = true}
          />
        </header>
        <Tabs center value={pageId} onChange={this.onTabsChange}>
          {App.pages.map(pageId => {
            var { Tab } = pageManager.getComponents(pageId);
            if (Tab) return <Tab key={pageId} value={pageId}/>
          })}
        </Tabs>
        <div className="TabContent">
          {Page && <Page/>}
          {!Page && <p className="not-found">Page not found</p>}
        </div>
        <Footer/>
        <Notifications/>
        <AppRateDialog/>
        <ExportImportSettingsDialog
          isOpen={this.showImportExportDialog}
          onClose={() => this.showImportExportDialog = false}
        />
      </div>
    );
  }
}

// init app
App.init();