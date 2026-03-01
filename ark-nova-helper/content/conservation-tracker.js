/**
 * Conservation race tracker for Ark Nova Helper.
 * Reads all players' conservation and appeal scores from the DOM.
 */
const ArkConservationTracker = (() => {
  /**
   * Read all players' conservation and appeal data from the DOM.
   * @returns {Array<{id: string, name: string, color: string, conservation: number, appeal: number, gap: number}>}
   */
  function readAllPlayers() {
    const players = [];

    // Find all conservation counters to discover player IDs
    document.querySelectorAll('[id^="counter-"][id$="-conservation"]').forEach((el) => {
      const match = el.id.match(/^counter-(\d+)-conservation$/);
      if (!match) return;

      const pId = match[1];
      const conservation = parseInt(el.textContent.trim(), 10) || 0;

      const appealEl = document.getElementById(`counter-${pId}-appeal`);
      const appeal = appealEl ? parseInt(appealEl.textContent.trim(), 10) || 0 : 0;

      // Get player name from BGA player panel
      const nameEl =
        document.querySelector(`#player_name_${pId} a`) ||
        document.getElementById(`player_name_${pId}`);
      const name = nameEl ? nameEl.textContent.trim() : `Player ${pId}`;

      // Get player color
      const colorLink = document.querySelector(`#player_name_${pId} a`);
      const color = colorLink ? colorLink.style.color || '#666' : '#666';

      players.push({
        id: pId,
        name,
        color,
        conservation,
        appeal,
        gap: appeal - conservation,
      });
    });

    // Sort by conservation descending (leader first)
    return players.sort((a, b) => b.conservation - a.conservation);
  }

  return {
    readAllPlayers,
  };
})();
