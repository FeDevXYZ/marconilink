// ========== CONFIGURAZIONE AVATAR ==========
// Aggiungi qui i link alle tue immagini profilo personalizzate
export const CUSTOM_AVATAR_URLS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user3",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user4",
  "https://api.dicebear.com/7.x/micah/svg?seed=user5",
  "https://api.dicebear.com/7.x/personas/svg?seed=user6",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user7",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user8",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user9",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user10",
  "https://api.dicebear.com/7.x/micah/svg?seed=user11",
  "https://api.dicebear.com/7.x/personas/svg?seed=user12",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user13",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user14",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user15",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user16",
  "https://api.dicebear.com/7.x/micah/svg?seed=user17",
  "https://api.dicebear.com/7.x/personas/svg?seed=user18",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user19",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user20",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user21",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user22",
  "https://api.dicebear.com/7.x/micah/svg?seed=user23",
  "https://api.dicebear.com/7.x/personas/svg?seed=user24",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user25",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user26",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user27",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user28",
  "https://api.dicebear.com/7.x/micah/svg?seed=user29",
  "https://api.dicebear.com/7.x/personas/svg?seed=user30",
];

/**
 * Ottiene un avatar fisso per un utente basato sul suo ID
 * L'avatar non cambierà mai per lo stesso userId
 */
export function getAvatarForUser(userId: string, avatarIndex?: number): string {
  if (avatarIndex !== undefined && avatarIndex >= 0 && avatarIndex < CUSTOM_AVATAR_URLS.length) {
    return CUSTOM_AVATAR_URLS[avatarIndex];
  }
  
  // Genera un indice consistente basato sull'userId
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % CUSTOM_AVATAR_URLS.length;
  return CUSTOM_AVATAR_URLS[index];
}

/**
 * Ottiene l'indice dell'avatar selezionato
 */
export function getAvatarIndex(avatarUrl: string): number {
  const index = CUSTOM_AVATAR_URLS.indexOf(avatarUrl);
  return index >= 0 ? index : 0;
}
