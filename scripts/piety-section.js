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
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon4'));
      }
    }
    else if (newScore >= game.settings.get('pf2e-piety', 'third-threshold')) {
      if (oldScore >= game.settings.get('pf2e-piety', 'fourth-threshold')) {
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon4'), false);
      }
      else if (oldScore < game.settings.get('pf2e-piety', 'third-threshold')) {
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon3'));
      }
    }
    else if (newScore >= game.settings.get('pf2e-piety', 'second-threshold')) {
      if (oldScore >= game.settings.get('pf2e-piety', 'third-threshold')) {
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon3'), false);
      }
      else if (oldScore < game.settings.get('pf2e-piety', 'second-threshold')) {
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon2'));
      }
    }
    else if (newScore >= game.settings.get('pf2e-piety', 'first-threshold')) {
      if (oldScore >= game.settings.get('pf2e-piety', 'second-threshold')) {
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon2'), false);
      }
      else if (oldScore < game.settings.get('pf2e-piety', 'first-threshold')) {
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon1'));
        // $("li[data-field='boon1']").addClass("active-threshold");
      }
    }
    else {
      if (oldScore >= game.settings.get('pf2e-piety', 'first-threshold')) {
        Pf2ePiety.activateBoon(actor.getFlag('pf2e-piety', 'boon1'), false);
        // $("li[data-field='boon1']").removeClass("active-threshold");
      }
    }
    actor.setFlag('pf2e-piety', 'pietyScore', oldScore + amount);
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
      let activeRules = [];
      for (const rulesElement of boon.system.rules) {
        if(rulesElement.predicate.map(e => e?.not).filter(e => e).includes("self:creature")) {
          rulesElement.predicate.pop();
        }
        activeRules.push(rulesElement);
      }
      boon.update({"system.rules": activeRules});
    } else if (boon != null) {
      boon.update({"system.unidentified": true});
      let deActiveRules = [];
      for (const rulesElement of boon.system.rules) { 
        if (!rulesElement.predicate.map(e => e?.not).filter(e => e).includes("self:creature")) {
          rulesElement.predicate.push({"not":"self:creature"});
        }
        deActiveRules.push(rulesElement);
      }
      boon.update({"system.rules": deActiveRules});
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

  // Deity Actions
  $("a[data-action='edit-deity']").on("click", () => {
    let deity = fromUuidSync(character.deity.uuid);
    return deity.sheet.render(true);
  });
  
  // Piety Score Actions
  $("div.piety-score-modifier button[data-action='piety-score-decrease']").on("click", async (event) => {
    if (character.getFlag('pf2e-piety', 'pietyScore') > 1) {
      Pf2ePiety.incrementPiety(character, -1);
    }
  });

  $("div.piety-score-modifier button[data-action='piety-score-increase']").on("click", async (event) => {
    Pf2ePiety.incrementPiety(character, 1);
  });

  // Edicts/Anathema Actions
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

  $("a[data-action='boon-edit']").on("click", (html) => {
    let uuid = character.getFlag('pf2e-piety', $(html.target).parents('li[data-field]')[0].dataset.field);
    let boon = fromUuidSync(uuid);
    return boon.sheet.render(true);
  });

  $("a[data-action='boon-delete']").on("click", async (html) => {
    let uuid = character.getFlag('pf2e-piety', $(html.target).parents('li[data-field]')[0].dataset.field);
    let boon = fromUuidSync(uuid);
    let d = new Dialog({
      title: "Delete Item: " + boon.name,
      content: "<p>Are you sure?</p><p>This Item will be permanently deleted and cannot be recovered.</p><p><i>This will also remove the item from its Piety Boon slot.</i></p>",
      buttons: {
        yes: {
         icon: '<i class="fas fa-check"></i>',
         label: "Yes",
         callback: async () => await Item.deleteDocuments([boon.id], {parent: character})
        },
        no: {
         icon: '<i class="fas fa-times"></i>',
         label: "No"
        }
       },
       default: "no"
    });
    d.render(true);
  });
});

Hooks.on("preCreateItem", async (document, sourceData, userId) => {
    if (Pf2ePiety.dropTarget != null) {
      if (document.type == "effect") {
      } else {
        ui.notifications.warn('Pf2e-Piety: You must choose an <i>Effect</i> to add to your threshold.');
        return false; // FIXME: Document is still being created. Its possibly coming from a different preCreateItem from the system.
      }
    }
});

/* Checks for Pf2ePiety.dropTarget then adds boon to flags and possibly "deactivates" it. */
Hooks.on("createItem", async (document, options, userID) => {
  let actor = document.parent;
  if (Pf2ePiety.dropTarget != null) {
    if (document.type == "effect") {
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
      if (document.type == "effect") {
        Pf2ePiety.checkBoon(document.parent, Pf2ePiety.dropTarget);
        await actor.setFlag('pf2e-piety', Pf2ePiety.dropTarget, document.uuid);
        if (score < threshold) {
          Pf2ePiety.activateBoon(document.uuid, false);
        }
      }
    }
  }
})