/* The Game Settings for this module. */

export const registerSettings = function() {
  let moduleName = "pf2e-piety";

  // Piety Score Thresholds
  game.settings.register(moduleName, "first-threshold", {
    name: "First Threshold",
    hint: "The Piety score players must reach to get their first Deity Boon.",
    scope: "world",
    config: true,
    requiresReload: true,
    type: Number,
    range: {             /
      min: 1,
      max: 50,
      step: 1
    }
    default: 3,
    onChange: (value) => {
      game.user.setFlag("pf2e-piety", "threshold1", value);
    }
  });
  game.settings.register(moduleName, "second-threshold", {
    name: "Second Threshold",
    hint: "The Piety score players must reach to get their second Deity Boon.",
    scope: "world",
    config: true,
    requiresReload: true,
    type: Number,
    range: {             // If range is specified, the resulting setting will be a range slider
      min: 1,
      max: 50,
      step: 1
    }
    default: 10,
    onChange: (value) => {
      game.user.setFlag("pf2e-piety", "threshold2", value);
    }
  });
  game.settings.register(moduleName, "third-threshold", {
    name: "First Threshold",
    hint: "The Piety score players must reach to get their third Deity Boon.",
    scope: "world",
    config: true,
    requiresReload: true,
    type: Number,
    range: {             // If range is specified, the resulting setting will be a range slider
      min: 1,
      max: 50,
      step: 1
    }
    default: 25,
    onChange: (value) => {
      game.user.setFlag("pf2e-piety", "threshold3", value);
    }
  });
  game.settings.register(moduleName, "fourth-threshold", {
    name: "Fourth Threshold",
    hint: "The Piety score players must reach to get their fourth Deity Boon.",
    scope: "world",
    config: true,
    requiresReload: true,
    type: Number,
    range: {             // If range is specified, the resulting setting will be a range slider
      min: 1,
      max: 50,
      step: 1
    }
    default: 50,
    onChange: (value) => {
      game.user.setFlag("pf2e-piety", "threshold4", value);
    }
  });

}
