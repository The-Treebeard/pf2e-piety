/* PSEUDOCODE:
- Add Pf2ePiety class
- Add method to add edicts and method to add anathemas. (Pf2e biography style)
-- Add array of edicts and anathemas.
- Add the ability to drag-and-drop Feat/Features with "Deity Boon"  to sections.
- Get access to player's chosen deity and display it.

- Reference my settings.ts to get the numbers for Piety threshhold.
*/

export class Pf2ePiety {
  
}

Hooks.once('init', Pf2ePiety.init);
Hooks.once('ready', Pf2ePiety.ready);

// ADD: "dropover" event with dropTarget. See MonksAftermath.
Hooks.on("renderCharacterSheetPf2e", async (charactersheet, html, data) => {
  // Need const content.
  $("div[data-field='pietyEdicts'] a[data-action='add-piety-edict-anathema']", content).on("click", async (event) => {
    // EDIT: Add code here.
  }
}
