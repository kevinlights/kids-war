// Factions that populate the world map. Parties cluster around faction anchors.
//
// `color` is the faction's identity everywhere: it is the cloth colour of the
// commander sprite the world map draws for a party (tools/pixel-assets reads
// this very table), the legend swatch, the minimap dot and the battle chip.

export const FACTIONS = {
  player: {
    key: 'player',
    name: '你的部队',
    en: 'Your Warband',
    color: '#4aa3ff',
    hostile: false
  },
  bandit: {
    key: 'bandit',
    name: '强盗',
    en: 'Bandits',
    // Bandits are grey: the one faction with no royal colour, so the two
    // kingdoms stay the only saturated colours on the map.
    color: '#9aa2ab',
    hostile: true,
    // Bandits are the special faction: always hostile and roaming.
    special: true
  },
  wolf: {
    key: 'wolf',
    name: '苍狼王国',
    en: 'Wolf Kingdom',
    color: '#7a5cc0',
    hostile: true
  },
  eagle: {
    key: 'eagle',
    name: '赤鹰王国',
    en: 'Eagle Kingdom',
    color: '#c98a2b',
    hostile: true
  }
}

export const FACTION_KEYS = Object.keys(FACTIONS)

// Factions that spawn parties on the map (player is excluded).
export const NPC_FACTIONS = ['bandit', 'wolf', 'eagle']

export function factionOf(key) {
  return FACTIONS[key] || FACTIONS.bandit
}
