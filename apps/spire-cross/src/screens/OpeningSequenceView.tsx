import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NarrativeReader from '../components/NarrativeReader';
import BattleView from './BattleView';
import { TUTORIAL_CHARACTERS, getCharacter } from '../data/characters';
import { CHRONOS } from '../data/enemies';
import { createInitialProgress } from '../game/leveling';
import { THEME } from '../components/AppBackground';

type Phase = 'intro' | 'battle' | 'defeat' | 'wakeup';

const INTRO_TEXT = `長い階段を昇りきった先に、その扉はあった。見上げるほど巨大な両開きの扉。表面に刻まれた無数の紋様は、時が幾重にも重なり合う螺旋を描いている。

「……ここが、最後だ」

旅人は、隣に立つアリアの手を握った。柔らかく、けれど確かな力で、アリアはその手を握り返す。振り返れば、共に死線をくぐり抜けてきた仲間の顔がある。さらにその奥、静かに佇む竜の意匠の鎧の男――終焉の竜騎士。彼の傍らにも、いつも変わらず寄り添う誰かの姿があった。数えきれない戦いを共にした、最強のパーティ。だが今、この扉の向こうに待つものだけは、誰も本当の意味では知らなかった。

扉を押し開けると、広間の最奥、玉座に腰掛ける一つの影があった。

「――来たか」

「お前が……クロノス」

玉座の影が、ゆっくりと立ち上がる。その姿を見た瞬間、旅人の全身が総毛立った。理屈ではない。本能が、これは"勝てる相手ではない"と告げていた。それでも、退く理由にはならなかった。

「行くぞ」`;

const DEFEAT_TEXT = `最初の数合は、悪くなかった。積み重ねてきた連携、磨いてきた剣技――すべてが噛み合い、クロノスの姿を確かに揺らがせていく。

「いける……!」

そう思えるところまでは、確かに届いた。けれど、そこからだった。

クロノスの纏う空気が、変わった。

「――終わりの時間だ」

静かな声とともに、玉座の間全体が、深い藍色の光に呑まれていく。それは時の流れそのものを歪めるような、抗いようのない奔流だった。仲間たちの悲鳴が、遠くに聞こえた。一人、また一人と、光の奔流に呑まれて崩れ落ちていく。

「アリア――!」

旅人が手を伸ばした瞬間、アリアの体が、淡い光の粒子になって散っていく。

「大丈夫」

最後に、彼女はそう笑った気がした。旅人を安心させるための、精一杯の嘘だったのかもしれない。

「わたしのことは、忘れてもいいから――」

同じ光の奔流は、終焉の竜騎士の傍らにいた人物をも呑み込んでいく。彼はそれに抗わなかった。ただ静かに、目を伏せたまま見送った――まるで、それだけが自分にできる、精一杯の愛し方だとでも言うように。

その声を最後に、旅人の視界は白く染まり、意識が、急速に闇へ落ちていった。`;

const WAKEUP_TEXT = `鳥の声で、目を覚ました。

瞼を開けると、そこには見知らぬ空が広がっていた。眩しいほどの朝焼け。頬に触れる、乾いた草の感触。

記憶を辿ろうとして、愕然とした。何も、思い出せない。剣を握っていたはずの感覚、共に戦った仲間の顔、そして――誰か、大切な人がいたはずの温もり。すべてが、霧の向こうに沈んでいる。

ただ一つだけ、燃えるように鮮明な感覚があった。

――怒り。

何もかもを奪われたという、行き場のない怒り。

旅人は、緩やかな草原の向こうに、小さな町の輪郭を見つけた。朝日を受けて、屋根の連なりが淡く輝いている。

「ここから、俺の復讐が始まる」`;

const TUTORIAL_DECK: string[] = [
  ...Array(2).fill('tutorial_traveler_atk'),
  ...Array(2).fill('tutorial_traveler_skl'),
  ...Array(2).fill('tutorial_aria_atk'),
  ...Array(2).fill('tutorial_aria_skl'),
  ...Array(2).fill('tutorial_ally_atk'),
  ...Array(2).fill('tutorial_ally_skl'),
  ...Array(2).fill('doom_dragoon_atk'),
  ...Array(2).fill('doom_dragoon_pow'),
];

// 終焉の竜騎士(doom_dragoon)は通常ガチャでも入手できる本編ロスターのキャラだが、
// 序章のクロノス戦では"最強のパーティ4人目"として同じ夜に敗れる当人でもあるため、
// 専用のTUTORIAL_CHARACTERSは作らず、CHARACTERSの実データをそのままパーティに加える
// (STORY.md 6.13運用メモ・8章参照)。

/**
 * 序章: クロノスとの決戦(チュートリアル)〜敗北〜草原での目覚めまでの、
 * 初回起動時に必ず通る導入シーケンス。実際のキャラ絵・動画は後日差し替え予定のため、
 * 現時点ではNarrativeReader(ビジュアルノベル風テキスト)で構成している。
 */
export default function OpeningSequenceView({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');

  const doomDragoon = getCharacter('doom_dragoon');
  const tutorialParty = [...TUTORIAL_CHARACTERS, ...(doomDragoon ? [doomDragoon] : [])].map(
    (character) => ({
      character,
      progress: createInitialProgress(),
    })
  );

  if (phase === 'battle') {
    return (
      <View style={styles.battleFrame}>
        <BattleView
          stageLabel="序章 崩壊の夜"
          partyMembers={tutorialParty}
          deckCardIds={TUTORIAL_DECK}
          enemyDefs={[CHRONOS]}
          onEnemyThreshold={{ enemyId: 'chronos', ratio: 0.4, onTrigger: () => setPhase('defeat') }}
          onFinished={() => setPhase('defeat')}
          hintText="カードをタップ→使うキャラをタップ→攻撃カードはそのまま敵をタップ。手札を出し切ったら「ターン終了」を押そう。"
        />
      </View>
    );
  }

  if (phase === 'defeat') {
    return (
      <NarrativeReader
        chapterLabel="PROLOGUE"
        title="崩壊の夜"
        body={DEFEAT_TEXT}
        continueLabel="……"
        onContinue={() => setPhase('wakeup')}
      />
    );
  }

  if (phase === 'wakeup') {
    return (
      <NarrativeReader
        chapterLabel="序章"
        title="目覚め"
        body={WAKEUP_TEXT}
        continueLabel="旅を始める"
        onContinue={onDone}
      />
    );
  }

  return (
    <NarrativeReader
      chapterLabel="PROLOGUE"
      title="崩壊の夜"
      body={INTRO_TEXT}
      continueLabel="戦闘へ"
      onContinue={() => setPhase('battle')}
    />
  );
}

const styles = StyleSheet.create({
  battleFrame: { flex: 1, backgroundColor: THEME.bgBottom },
});
