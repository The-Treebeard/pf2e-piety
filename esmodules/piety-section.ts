/* PSEUDOCODE:
- Add Pf2ePiety class
- Add method to add edicts and method to add anathemas. (Pf2e biography style)
-- Add array of edicts and anathemas.
- Add the ability to drag-and-drop Feat/Features with "Deity Boon"  to sections.
- Get access to player's chosen deity and display it.

- Reference my settings.ts to get the numbers for Piety threshhold.
*/

export class Pf2ePiety {
  // Set new property on actor called pietyEdicts and pietyAnathema.
}

Hooks.once('init', Pf2ePiety.init);
Hooks.once('ready', Pf2ePiety.ready);

// ADD: "dropover" event with dropTarget. See MonksAftermath.
Hooks.on("renderCharacterSheetPf2e", async (charactersheet, html, data) => {
  const edicts = app.document.flags?.piety?.edicts ?? [];
  // Append piety-section.hbs to below Divine Intercession list.
  let pietyTemplate = await renderTemplate('modules/pf2e-piety/templates/piety-section.hbs'); // FIXME: Needs second argument of data.
  let divineList = html.querySelectorAll('.effects .effects-list');
  divineList[divineList.length-1].insertAdjacentHTML('afterend', pietyTemplate);
  
  $("div[data-field='pietyEdicts'] a[data-action='add-piety-edict-anathema']", content).on("click", async (event) => {
    await setFlag("pf2e-piety", "edicts", "edicts.push()");
  }
}
