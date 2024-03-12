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
   * @param {CharacterPF2E} actor The Actor to be modified.
   * @param {Number} amount The amount by which pietyScore should be incremented.
   */
  static incrementPiety(actor, amount) {
    let oldScore = actor.getFlag("pf2e-piety", "pietyScore");
    actor.flags["pf2e-piety"].pietyScore = oldScore + amount;
    let newScore = actor.getFlag("pf2e-piety", "pietyScore");
    if (newScore >= game.settings.get('pf2e-piety', 'fourth-threshold')) {
      if (oldScore < game.settings.get('pf2e-piety', 'fourth-threshold')) {
        console.log("Activate Boon 4.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon4'));
      }
    }
    else if (newScore >= game.settings.get('pf2e-piety', 'third-threshold')) {
      if (oldScore >= game.settings.get('pf2e-piety', 'fourth-threshold')) {
        console.log("Deactivate Boon 4.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon4'), false);
      }
      else if (oldScore < game.settings.get('pf2e-piety', 'third-threshold')) {
        console.log("Activate Boon 3.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon3'));
      }
    }
    else if (newScore >= game.settings.get('pf2e-piety', 'second-threshold')) {
      if (oldScore >= game.settings.get('pf2e-piety', 'third-threshold')) {
        console.log("Deactivate Boon 3.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon3'), false);
      }
      else if (oldScore < game.settings.get('pf2e-piety', 'second-threshold')) {
        console.log("Activate Boon 2.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon2'));
      }
    }
    else if (newScore >= game.settings.get('pf2e-piety', 'first-threshold')) {
      if (oldScore >= game.settings.get('pf2e-piety', 'second-threshold')) {
        console.log("Deactivate Boon 2.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon2'), false);
      }
      else if (oldScore < game.settings.get('pf2e-piety', 'first-threshold')) {
        console.log("Activate Boon 1.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon1'));
      }
    }
    else {
      if (oldScore >= game.settings.get('pf2e-piety', 'first-threshold')) {
        console.log("Deactivate Boon 1.");
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon1'), false);
      }
    }
    actor.setFlag('pf2e-piety', 'pietyScore', oldScore + amount);
    // TODO: Check threshold and hide and false-predicate boons.
    // Set booleans. If the boolean needs to be changed, change the rendering then change the boon.
    // activate: set unidentified to false, and  if ruleElement.predicate.includes("not: self:creature"), pop() the array.
    // unactivate: set unidentified to true, and push("not: self:creature")
  }

  /**
   * Unidentifies boon and removes always-false rules predicates. The opposite is done if activate is set to false.
   * @param {String} uuid The item uuid.
   * @param {boolean} activate A boolean to determine if boon should be activated or deactivated.
   */
  static async activateBoon(uuid, activate = true) {
    let boon = await fromUuid(uuid);
    if (boon != null && activate) {
      boon.update({"system.unidentified": false});
      console.log(boon);
      // remove always-false predicates
    } else if (boon != null) {
      boon.update({"system.unidentified": true});
      // add always false predicates
    }
   
  }

  /**
   * Checks if boon is already attached to flag, then deletes it.
   * @param {CharacterPF2E} parent The parent Actor the EmbeddedDocument is attached to.
   * @param {string} flagName The name of the flag the EmbeddedDocument corresponds with.
   */
  static async checkBoon(parent, flagName) {
    let boon = fromUuidSync(parent.getFlag('pf2e-piety', flagName));
      if (boon != null) {
        const deleted = await Item.deleteDocuments([boon.id], {parent: parent});
      }
    }
  }
console.log("Starting Hooks.");
Hooks.once('init', Pf2ePiety.init);

Hooks.on("renderCharacterSheetPF2e", async (charactersheet, html, data) => {
  Handlebars.registerHelper('increment', (aString) => {
    return parseInt(aString)+1;
  })

  const character = charactersheet.actor;
  let score = character.flags["pf2e-piety"]?.pietyScore ?? 1;
  var edicts = character.flags["pf2e-piety"]?.edicts ?? [];
  var anathema = character.flags["pf2e-piety"]?.anathema ?? [];
  let boon1 = await fromUuid(character.flags["pf2e-piety"]?.boon1 ?? null);
  let boon2 = await fromUuid(character.flags["pf2e-piety"]?.boon2 ?? null);
  let boon3 = await fromUuid(character.flags["pf2e-piety"]?.boon3 ?? null);
  let boon4 = await fromUuid(character.flags["pf2e-piety"]?.boon4 ?? null);
  character.setFlag('pf2e-piety', 'pietyScore', score);
  character.setFlag('pf2e-piety', 'edicts', edicts);
  character.setFlag('pf2e-piety', 'anathema', anathema);
  // Append piety-section.hbs to below Divine Intercession list.
  var pietyTemplate = await renderTemplate('modules/pf2e-piety/templates/piety-section.hbs', {
    deity: character.deity,
    piety: character.flags["pf2e-piety"],
    boon1: boon1,
    boon2: boon2,
    boon3: boon3,
    boon4: boon4,
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
      Pf2ePiety.incrementPiety(character, -1);
    }
  });

  $("div.piety-score-modifier button[data-action='piety-score-increase']").on("click", async (event) => {
    Pf2ePiety.incrementPiety(character, 1);
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
      if (document.type == "effect") { // FIXME: Change to Effect.
        console.log("Valid boon selected");
        // Do Somthing
        if (score < threshold) {
          // TODO: Unidentify and false-predicate boon.
          document.updateSource({"system.unidentified": true});
        }
      } else {
        ui.notifications.warn('Pf2e-Piety: You must choose an <i>Effect</i> to add to your threshold.');
        return false;
      }
    }
});

Hooks.on("createItem", async (document, options, userID) => {
  // TODO: Edit boon to be false-predicated. (item.system.rules > for each rule.predicate (push {"not": "self:creature"})
  // TODO: Unrender boon. Not userId.render = false  or  document.visible = false; Or Unidentify Item.
  let actor = document.parent;

  if (Pf2ePiety.dropTarget != null) {
    if (document.type == "effect") {
      Pf2ePiety.checkBoon(document.parent, Pf2ePiety.dropTarget);
      await actor.setFlag('pf2e-piety', Pf2ePiety.dropTarget, document.uuid);
    }
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