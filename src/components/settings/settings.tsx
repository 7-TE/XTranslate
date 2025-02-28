import "./settings.scss";

import * as React from "react";
import { observer } from "mobx-react";
import { getTranslators } from "../../vendors";
import { createTab } from "../../extension";
import { getHotkey, parseHotkey, prevDefault } from "../../utils";
import { XTranslateIcon } from "../../user-script/xtranslate-icon";
import { SelectLanguage } from "../select-language";
import { Input, NumberInput } from "../input";
import { Checkbox } from "../checkbox";
import { Radio, RadioGroup } from "../radio";
import { Option, Select } from "../select";
import { Icon } from "../icon";
import { Button } from "../button";
import { Popup } from "../popup";
import { TooltipProps } from "../tooltip";
import { SubTitle } from "../sub-title";
import { Tab } from "../tabs";
import { settingsStore } from "./settings.storage";
import { pageManager } from "../app/page-manager";
import { getMessage } from "../../i18n";

@observer
export class Settings extends React.Component {
  onSaveHotkey = (evt: React.KeyboardEvent) => {
    var nativeEvent = evt.nativeEvent;
    var hotkey = parseHotkey(nativeEvent);
    if (hotkey.code) {
      settingsStore.data.hotkey = getHotkey(nativeEvent);
    }
  }

  render() {
    var settings = settingsStore.data;
    var hotKey = parseHotkey(settings.hotkey);
    var popupTooltip: Partial<TooltipProps> = {
      style: { background: "none" },
      children: <Popup preview/>
    };
    return (
      <div className="Settings flex column gaps">
        <div className="common-settings flex gaps auto">
          <div className="checkbox-group flex column">
            <SubTitle>{getMessage("settings_title_tts")}</SubTitle>
            <Checkbox
              label={getMessage("auto_play_tts")}
              checked={settings.autoPlayText}
              onChange={v => settings.autoPlayText = v}
            />
            <Checkbox
              label={getMessage("use_chrome_tts")}
              checked={settings.useChromeTtsEngine}
              onChange={v => settings.useChromeTtsEngine = v}
              tooltip={getMessage("use_chrome_tts_tooltip_info")}
            />
          </div>
          <div className="checkbox-group flex column">
            <SubTitle>{getMessage("settings_title_appearance")}</SubTitle>
            <Checkbox
              label={getMessage("show_context_menu")}
              checked={settings.showInContextMenu}
              onChange={v => settingsStore.data.showInContextMenu = v}
            />
            <Checkbox
              label={getMessage("display_icon_near_selection")}
              checked={settings.showIconNearSelection}
              onChange={v => settings.showIconNearSelection = v}
              tooltip={<XTranslateIcon preview/>}
            />
          </div>
        </div>

        <SubTitle>{getMessage("setting_title_translator_service")}</SubTitle>

        <div className="translator-settings flex gaps column">
          <SelectLanguage showInfoIcon/>
          <RadioGroup
            className="vendors flex column gaps"
            value={settings.vendor}
            onChange={v => settingsStore.setVendor(v)}
          >
            {getTranslators().map(vendor => {
              const { name, title, publicUrl } = vendor;
              var domain = publicUrl.match(/https?:\/\/(.*?)(?:\/\w*|$)/i)[1];
              return (
                <div key={name} className="vendor flex gaps">
                  <Radio value={name} label={title}/>
                  <a href={publicUrl} target="_blank" tabIndex={-1}>
                    {domain.split('.').slice(-2).join('.')}
                  </a>
                  <div className="vendor-settings-widget flex gaps align-center">
                    {vendor.renderSettingsListWidget()}
                  </div>
                </div>
              )
            })}
          </RadioGroup>
        </div>

        <SubTitle>{getMessage("setting_title_popup")}</SubTitle>

        <div className="popup-settings flex auto">
          <div className="checkbox-group">
            <Checkbox
              label={getMessage("show_tts_icon_inside_popup")}
              checked={settings.showTextToSpeechIcon}
              onChange={v => settings.showTextToSpeechIcon = v}
              tooltip={popupTooltip}
            />
            <Checkbox
              label={getMessage("show_next_vendor_icon_in_popup")}
              checked={settings.showNextVendorIcon}
              onChange={v => settings.showNextVendorIcon = v}
              tooltip={popupTooltip}
            />
            <Checkbox
              label={getMessage("show_copy_translation_icon")}
              checked={settings.showCopyTranslationIcon}
              onChange={v => settings.showCopyTranslationIcon = v}
              tooltip={popupTooltip}
            />
            <Checkbox
              label={getMessage("show_detected_language_block")}
              checked={settings.showTranslatedFrom}
              onChange={v => settings.showTranslatedFrom = v}
              tooltip={popupTooltip}
            />
            <div className="flex gaps align-center">
              <Icon
                htmlFor="select_popup_position"
                material="display_settings"
                tooltip={getMessage("popup_position_title")}
              />
              <Select
                id="select_popup_position"
                className="box grow"
                value={settings.popupFixedPos}
                onChange={v => settings.popupFixedPos = v}
              >
                <Option value="" label={getMessage("popup_position_auto")}/>
                <Option value="leftTop" label={getMessage("popup_position_left_top")}/>
                <Option value="rightTop" label={getMessage("popup_position_right_top")}/>
                <Option value="leftBottom" label={getMessage("popup_position_left_bottom")}/>
                <Option value="rightBottom" label={getMessage("popup_position_right_bottom")}/>
              </Select>
            </div>
          </div>
          <div className="checkbox-group">
            <Checkbox
              label={getMessage("display_popup_after_text_selected")}
              checked={settings.showPopupAfterSelection}
              onChange={v => settings.showPopupAfterSelection = v}
            />
            <Checkbox
              label={getMessage("display_on_click_by_selected_text")}
              checked={settings.showPopupOnClickBySelection}
              onChange={v => settings.showPopupOnClickBySelection = v}
            />
            <Checkbox
              label={getMessage("display_popup_on_double_click")}
              checked={settings.showPopupOnDoubleClick}
              onChange={v => settings.showPopupOnDoubleClick = v}
            />
            <Checkbox
              className="box grow"
              label={getMessage("display_popup_on_hotkey") + ":"}
              checked={settings.showPopupOnHotkey}
              onChange={v => settings.showPopupOnHotkey = v}
              tooltip={hotKey.title}
            />
            <label className="flex">
              <Icon material="keyboard"/>
              <Input
                readOnly
                className="hotkey box grow"
                value={hotKey.value}
                onKeyDown={prevDefault(this.onSaveHotkey)}
              />
            </label>
          </div>
        </div>

        <SubTitle>{getMessage("setting_title_text_input")}</SubTitle>

        <div className="flex gaps align-center">
          <Button
            outline
            className="box flex gaps"
            onClick={() => createTab("chrome://extensions/shortcuts")}
            tooltip={getMessage("quick_access_configure_link")}
            children={getMessage("sub_header_quick_access_hotkey")}
          />
          <div className="flex column gaps">
            <div className="flex gaps align-center">
              <p>{getMessage("translation_delay")}</p>
              <NumberInput
                className="box grow"
                min={0} max={10000} step={50}
                value={settings.textInputTranslateDelayMs}
                onChange={v => settings.textInputTranslateDelayMs = v}
              />
            </div>
            <small>{getMessage("translation_delay_info")}</small>
          </div>
        </div>
      </div>
    );
  }
}

pageManager.registerComponents("settings", {
  Tab: props => <Tab {...props} label={getMessage("tab_settings")} icon="settings"/>,
  Page: Settings,
});
