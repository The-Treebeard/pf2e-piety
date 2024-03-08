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

  /**
   * Increases Piety Score for actor by a set amount.
   * @param {Actor} actor 
   * @param {Number} amount 
   */
  static incrementPiety(actor, amount) {
    actor.setFlag("pf2e-piety", pietyScore, pietyScore + amount);
    // TODO: Check threshold and hide and false-predicate boons.
    // Set booleans. If the boolean needs to be changed, change the rendering then change the boon.
  }

  /**
   * Checks if boon is already attached to flag, then deletes it.
   * @param {ActorDocument} parent 
   * @param {string} flagName 
   */
  static async checkBoon(parent, flagName) {
    let uuid = parent.getFlag('pf2e-piety', flagName);
    if (fromUuid(uuid) != null) { // FIXME: Promise needs to resolve or this will trugger every time.
      const deleted = await Item.deleteDocuments([fromUuid(uuid).id], {parent: parent}); // FIXME: Promise needs to resolve first.
    }
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

Hooks.on("renderCharacterSheetPF2e", async (charactersheet, html, data) => {
  Handlebars.registerHelper('increment', (aString) => {
    return parseInt(aString)+1;
  })

  const character = charactersheet.actor;
  var edicts = character.flags["pf2e-piety"]?.edicts ?? [];
  var anathema = character.flags["pf2e-piety"]?.anathema ?? [];
  let score = character.flags["pf2e-piety"]?.pietyScore ?? 1;
  let boon1 = await fromUuid(character.flags["pf2e-piety"]?.boon1 ?? null);
  character.setFlag('pf2e-piety', 'pietyScore', score);
  character.setFlag('pf2e-piety', 'edicts', edicts);
  character.setFlag('pf2e-piety', 'anathema', anathema);
  // Append piety-section.hbs to below Divine Intercession list.
  var pietyTemplate = await renderTemplate('modules/pf2e-piety/templates/piety-section.hbs', {
    deity: character.deity,
    piety: character.flags["pf2e-piety"],
    boon1: boon1,
    boon2: fromUuidSync(character.flags["pf2e-piety"].boon2),
    boon3: fromUuidSync(character.flags["pf2e-piety"].boon3),
    boon4: fromUuidSync(character.flags["pf2e-piety"].boon4),
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
    await character.flags['pf2e-piety'].edicts.push("");
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

  // Boon Updates
  $("ol[class='thresholds'] > li").on("dragenter", (html) => {
    if ($(html.target).parents('li[data-field]').length > 0) {
      Pf2ePiety.dropTarget = $(html.target).parents('li[data-field]')[0].dataset.field;
    } else {
      Pf2ePiety.dropTarget = $(html.target).data('field');
    }
  });

  $("ol[class='thresholds'] li").on("mouseleave", (html) => {
    Pf2ePiety.dropTarget = null;
  });
});

Hooks.on("preCreateItem", async (document, sourceData, userId) => {
    if (Pf2ePiety.dropTarget != null) {
      let score = document.parent.flags['pf2e-piety'].pietyScore;
      let threshold = null;
      switch (Pf2ePiety.dropTarget) {
        case("boon1"):
          threshold = game.settings.get('pf2e-piety','first-threshold');
          break;
        case("boon2"):
          threshold = game.settings.get('pf2e-piety','second-threshold');
          break;
        case("boon3"):
          threshold = game.settings.get('pf2e-piety','third-threshold');
          break;
        case("boon4"):
          threshold = game.settings.get('pf2e-piety','fourth-threshold');
          break;
        default:
          threshold = null;
      }
      console.log("Valid boon target: " + Pf2ePiety.dropTarget);
      if (document.system.category == "deityboon") {
        console.log("Valid boon selected");
        // Do Somthing
        if (score < threshold) {
          // TODO: Unrender and false-predicate boon.
        }
      } else {
        ui.notifications.warn('Pf2e-Piety: You must choose a <i>Deity Boon</i> to add to your threshold.');
        return false;
      }
    }
});

Hooks.on("createItem", async (document, options, userID) => {
  // TODO: Edit boon to be false-predicated. (item.system.rules > for each rule.predicate (push {"not": "self:creature"})
  // TODO: Unrender boon. Not userId.render = false  or  document.visible = false;
  let actor = document.parent;

  if (Pf2ePiety.dropTarget != null) {
    if (document.system.category == "deityboon") {
      Pf2ePiety.checkBoon(document.parent, Pf2ePiety.dropTarget);
      await actor.setFlag('pf2e-piety', Pf2ePiety.dropTarget, document.uuid);
      // FIXME: Delete previous item in flag.
    }
  }
  else {
    console.log("Invalid boon target: " + Pf2ePiety.dropTarget);
  }
})

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