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

  static incrementPiety(actor, amount) {
    actor.setFlag("pf2e-piety", pietyScore, pietyScore + amount);
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
  Handlebars.registerHelper('increment', (aString) => {
    return parseInt(aString)+1;
  })

  const character = charactersheet.actor;
  var edicts = character.flags["pf2e-piety"]?.edicts ?? [];
  var anathema = character.flags["pf2e-piety"]?.anathema ?? [];
  let score = character.flags["pf2e-piety"]?.pietyScore ?? 1;
  character.setFlag('pf2e-piety', 'pietyScore', score);
  character.setFlag('pf2e-piety', 'edicts', edicts);
  character.setFlag('pf2e-piety', 'anathema', anathema);
  // Append piety-section.hbs to below Divine Intercession list.
  var pietyTemplate = await renderTemplate('modules/pf2e-piety/templates/piety-section.hbs', {
    deity: character.deity,
    piety: score,
    edicts: edicts,
    anathema: anathema,
    threshold1: game.settings.get('pf2e-piety','first-threshold'),
    threshold2: game.settings.get('pf2e-piety','second-threshold'),
    threshold3: game.settings.get('pf2e-piety','third-threshold'),
    threshold4: game.settings.get('pf2e-piety','fourth-threshold')
  });
  let divineList = $('section.tab.effects ol.effects-list');
  divineList[divineList.length-1].insertAdjacentHTML('afterend', pietyTemplate);
  
  // Piety Score Updates
  $("div.piety-score-modifier button[data-action='piety-score-decrease']").on("click", async (event) => {
    if (character.getFlag('pf2e-piety', 'pietyScore') > 1) {
      await character.setFlag("pf2e-piety", "pietyScore", character.flags["pf2e-piety"]?.pietyScore-1);
    }
  });

  $("div.piety-score-modifier button[data-action='piety-score-increase']").on("click", async (event) => {
    await character.setFlag("pf2e-piety", "pietyScore", character.flags["pf2e-piety"]?.pietyScore+1);
  });

  // Edicts/Anathema Updates
  $("div[data-field] a[data-action='add-piety-edict-anathema']").on("click", async (html) => {
    if ($(html.target).parents('div[data-field]').data('field') == 'edicts') {
    await character.flags['pf2e-piety'].edicts.push(""); // FIXME: Pushes, but can't be edited.
    character.setFlag('pf2e-piety', 'edicts', character.flags['pf2e-piety'].edicts); // FIXME: There has to be a better way to do this.
    }
    else if ($(html.target).parents('div[data-field]').data('field') == 'anathema') {
      await character.flags['pf2e-piety'].anathema.push(""); // FIXME: Pushes, but can't be edited.
      character.setFlag('pf2e-piety', 'anathema', character.flags['pf2e-piety'].anathema); // FIXME: There has to be a better way to do this.  
    }
  });

  $("div[data-field] a[data-action='delete-piety-edict-anathema']").on("click", async (html) => {
    let index = parseInt($(html.target).data('index'));
    if ($(html.target).parents('div[data-field]').data('field') == 'edicts') {
    await character.flags['pf2e-piety'].edicts.splice(index, 1);
    character.setFlag('pf2e-piety', 'edicts', character.flags['pf2e-piety'].edicts);
    }
    else if ($(html.target).parents('div[data-field]').data('field') == 'anathema') {
      await character.flags['pf2e-piety'].anathema.splice(index, 1);
      character.setFlag('pf2e-piety', 'anathema', character.flags['pf2e-piety'].anathema);
    }
  });

  $("div[data-field='edict'] input").on("keyup", async (html) => {
    let index = parseInt($(html.target).siblings('a[data-index]')[0].data('index'));
    await character.flags['pf2e-piety'].edicts.splice(index, 0, html.value); // FIXME: Doesn't save
    await character.setFlag('pf2e-piety', 'edicts', character.flags['pf2e-piety'].edicts);
    // get jQuery siblings(a[data-index]) to get index value. Use this to setFlag for the edict[index] as html.value
  });
});
