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
    piety: character.flags["pf2e-piety"],
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
  // End of Piety Score Updates

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

  $("div[data-field] input").on("keyup", async (html) => {
    let value = $(html.target).val();
    let index = parseInt($(html.target).siblings('a[data-index]').data('index'));
    if ($(html.target).parents('div[data-field]').data('field') == 'edicts') {
    await character.flags['pf2e-piety'].edicts.splice(index, 1, value);
    }
    else if ($(html.target).parents('div[data-field]').data('field') == 'anathema') {
      await character.flags['pf2e-piety'].anathema.splice(index, 1, value);
    }
  });
  // End of Edict/Anathema Updates.

  // Boon Updates
  $("ol[class='thresholds'] li").on("dragenter", (html) => {
    Pf2ePiety.dropTarget = $(html.target).data('field');
    console.log("Dragged into: " + Pf2ePiety.dropTarget); // FIXME: Will say 'undefined' in the middle of the list item.
  });

  $("ol[class='thresholds'] li").on("mouseleave", (html) => {
    Pf2ePiety.dropTarget = null;
    console.log("Focus gone.")
  });

  Hooks.on("preCreateItem", async (document, sourceData, userId) => {
    if (Pf2ePiety.dropTarget != null) {
      console.log("Valid boon target: " + Pf2ePiety.dropTarget);
      if (document.system.category == "deityboon") {
        console.log("Valid boon selected");
      } else {
        ui.notifications.warn('Invalid option for boon. Please select a feat/feature with the "Deity Boon" category.'); //FIXEM: Warning fires multiple times.
      }
    }
    else {
      console.log("Invalid boon target: " + Pf2ePiety.dropTarget);
    }
    // const sourceItem = fromUuid(data.uuid);
    // const sourceBoon = sourceItem.then((result) => {
    //   console.log(Pf2ePiety.dropTarget);
    //   if (document.parent == result) {
    //     console.log("Parent found!");
    //   } else {
    //     console.log("Parent not found.");
    //   }
    // });
  });

  Hooks.on("dropActorSheetData", async (actor, sheet, data) => { // FIXME
    // item.system.category == "deityboon";
    // if (data.type == "Item") {
    //   let item = game.items.get(data.uuid);
    //   if (item.system.category == "deityboon") {
    //     await character.setFlag("pf2e-piety", $(html.target).data("field"), item);
    //   }
    // }
    // Function to handle fromUuid Promise.
    // async function getBoon() { //FIXME: Need to find ACTUAL document.
    //   try {
    //     const document = await fromUuid(data.uuid);
    //     return document;
    //     // actor.setFlag('pf2e-piety', 'boon1', boon[0]);
    //   } catch (error) {
    //     console.error(error);
    //   }
    // }
    
    /*
    Treebeard
      Sorry, by "item", I mean a feat (specifically a Deity Boon).
      I don't want it to appear in the Divine Intercessions section, and I don't want any effects from it to be active.
    Tikael — Today at 2:29 PM
      Then no.
      If you don't want the item to appear on the actor then the item has to not be put on the actor.
      There's unidentified effects, which hide from players, but that's the only thing like that.
    Treebeard — Today at 2:31 PM
      I do want to appear on the character sheet (just in a different location), but I don't want it's effects to be active. It sounds like this isn't possible, though.
    Tikael — Today at 2:32 PM
      You won't be able to change the location without changing the item type
      If you wanted it to show up as a bonus feat or something that's easy enough since boons and feats are the same base item type.
      But you couldn't have it be a consumable then turn into the boon, that would require two different items since the data structure of the two item types is different
    Treebeard — Today at 2:33 PM
      Is it possible to have it simply be inactive then and keep the location?
    Tikael — Today at 2:34 PM
      Yes, you can predicate the bonuses
      What do you want to activate it?
    Treebeard — Today at 2:34 PM
      It will be dependent on a module flag value.
      That might just be a function I add in my module though to check.
    Tikael — Today at 2:36 PM
      You can have the module sniff out the boon and flip the predicate to something that's always true
      Flip between [{"not": "self:creature"}] and ["self:creature"]

    Also, change the rendering for the feat.
    Retrieve the item, access it's rules elements attribute, then for each rule, append a "not" predicate to the
    */
  });
});
