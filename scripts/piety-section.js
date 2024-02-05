/* PSEUDOCODE:
- Add Pf2ePiety class
- Add method to add edicts and method to add anathemas. (Pf2e biography style)
-- Add array of edicts and anathemas.
- Add the ability to drag-and-drop Feat/Features with "Deity Boon"  to sections.
- Get access to player's chosen deity and display it.

- Reference my settings.ts to get the numbers for Piety threshhold.
*/

import {registerSettings } from "./settings.js";

export let setting = key => {
  return game.settings.get("pf2e-piety", key);
};

export class Pf2ePiety {
  // Set new property on actor called pietyEdicts and pietyAnathema.
  static app = null;

  static async init() {
    registerSettings();

    Pf2ePiety.SOCKET = "module.pf2e-piety";
  }

  /*static async onMessage(data) {
    switch (data.action) {
        case 'sendMessage': {
            if (setting("notification-on-advance"))
                ui.notifications.info(data.message);
        }
    }
  }*/

  /*static ready() {
    game.socket.on(Pf2ePiety.SOCKET, Pf2ePiety.onMessage);
  }*/
}
console.log("Starting Hooks.");
Hooks.once('init', Pf2ePiety.init);
// Hooks.once('ready', Pf2ePiety.ready);

// ADD: "dropover" event with dropTarget. See MonksAftermath.
Hooks.on("renderCharacterSheetPF2e", async (charactersheet, html, data) => {
  const edicts = charactersheet.actor.flags?.piety?.edicts ?? [];
  // Append piety-section.hbs to below Divine Intercession list.
  let pietyTemplate = await renderTemplate('modules/pf2e-piety/templates/piety-section.hbs', { // FIXME: Uncaught (in promise) Error: Parse error on line 74: hbs
    piety: 1, // FIXME: Needs piety flag that can be updated.
    edicts: edicts
  });
  let divineList = html.querySelectorAll('.effects .effects-list');
  divineList[divineList.length-1].insertAdjacentHTML('afterend', pietyTemplate);
  
  $("div[data-field='pietyEdicts'] a[data-action='add-piety-edict-anathema']").on("click", async (event) => {
    await setFlag("pf2e-piety", "edicts", "edicts.push()");
  });
});
