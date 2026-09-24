import { ImageSourcePropType } from 'react-native';

// issueで届いたキャラクター立ち絵を、キャラID単位で登録していくレジストリ。
// まだ画像が無いキャラはここに存在しないため、参照側は必ずフォールバック
// (絵文字表示など)を用意すること。
const CHARACTER_ART: Record<string, ImageSourcePropType> = {
  doom_dragoon: require('../../assets/characters/doom_dragoon.png'),
};

export function getCharacterArt(characterId: string): ImageSourcePropType | undefined {
  return CHARACTER_ART[characterId];
}
