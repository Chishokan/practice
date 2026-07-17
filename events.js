// ======================================================
// イベント
//
// 2種類ある。性格がまるで違うので、分けて持つ。
//   学校行事   … 日付が決まっている。カレンダーに出る。計画を立てる対象。
//   特殊イベント … 毎週の抽選で起きる。計画を揺さぶる側。
// ======================================================


// ---- 1. 学校行事 -------------------------------------
// week は 0 = 4月1週目。4週で1ヶ月。
// forced   : true なら部活そのものがない（練習できない）
// growth   : その週の成長にかける倍率
// fatigue  : その週の疲労にかける倍率
// recover  : 追加で回復する疲労
const SCHOOL_EVENTS = [
  {
    week: 5, icon: "📖", name: "中間テスト", type: "test",
    desc: "部活動停止。練習はできないが、体は休まる。",
    forced: true, recover: 25,
  },
  {
    week: 12, icon: "📖", name: "期末テスト", type: "test",
    desc: "部活動停止。1学期の総決算。",
    forced: true, recover: 25,
  },
  {
    week: 16, icon: "🔥", name: "夏合宿 1週目", type: "camp",
    desc: "追い込みの1週。よく伸びるが、確実に消耗する。",
    growth: 1.7, fatigue: 1.8,
  },
  {
    week: 17, icon: "🔥", name: "夏合宿 2週目", type: "camp",
    desc: "仕上げ。ここで化けるか、ケガをするか。",
    growth: 1.7, fatigue: 1.8,
  },
  {
    week: 22, icon: "🏃", name: "体育祭", type: "school",
    desc: "練習は半分。走らされるので少し疲れる。",
    growth: 0.5, fatigue: 1.0, extraFatigue: 10,
  },
  {
    week: 26, icon: "🎭", name: "文化祭", type: "school",
    desc: "準備で部活どころではない。ただし気分は晴れる。",
    forced: true, recover: 15,
  },
  {
    week: 29, icon: "📖", name: "期末テスト", type: "test",
    desc: "これを越えれば、あとはウィンターカップだけ。",
    forced: true, recover: 25,
  },
];

// その週の学校行事を返す（なければ null）
function getSchoolEvent(week) {
  return SCHOOL_EVENTS.find(e => e.week === week) || null;
}

// カレンダーに出す予定は「学校行事」と「大会」の2種類。
// 別々の仕組みだが、カレンダーの上では同じ「その週の予定」でしかない。
// ここで1つにまとめてしまえば、描く側は違いを知らずに済む。
function getScheduleItem(week) {
  const tournament = getTournament(week);
  if (tournament) {
    return {
      icon: tournament.icon, name: tournament.name,
      desc: tournament.desc, type: "cup", tournament,
    };
  }
  return getSchoolEvent(week);
}


// ---- 1.5 メインストーリー ----------------------------
//
// 毎月1週目（week が4で割り切れる週）に1つ進む。全9話。
// 主人公は赤星蓮（1年・PG）。「ウィンターカップに行く」と言い出した張本人。
// 物語は彼が周りに認められていく話であり、認められるかどうかは
// プレイヤーが彼をどう育てたかで決まる。
//
// 各話は variants を持ち、上から順に when() を試して最初に当たったものを出す。
// 分岐の材料は3つ。
//   1. 赤星自身の能力（育てたか、放っておいたか）
//   2. チーム全体の総合力
//   3. 大会の結果
// 「同じ月でも、プレイヤーによって違う話が出る」ようにしてある。

// ストーリーが参照する物差し
const HERO = "赤星 蓮";

function hero() {
  return getPlayer(HERO);
}

function teamAvgOvr() {
  if (!players.length) return 0;
  return players.reduce((sum, p) => sum + calcOvr(p), 0) / players.length;
}

// 赤星がチームの中で何番目に上手いか（1が最上位）
function heroRank() {
  const h = hero();
  if (!h) return 99;
  return players.filter(p => calcOvr(p) > calcOvr(h)).length + 1;
}

// 赤星がチーム平均をどれだけ上回っているか。
// 順位で測ると分岐しない。赤星は4月の時点ですでにチーム1位だからだ（差 +6.4）。
// 「重点的に育てたか」を測れるのは、順位ではなく差のほう。
//   平等に育てる  → 32週後も +7.0 のまま
//   赤星を重視    → 4週で +8.0、32週で +12.3
function heroMargin() {
  const h = hero();
  if (!h) return 0;
  return calcOvr(h) - teamAvgOvr();
}

// 赤星がどんなPGに育っているか。
// 9月に起用法を選んでいれば、それが全て——プレイヤーが自分で決めたことなので、
// 能力値の計算で覆さない。選んでいない場合だけ、育ち方から判断する。
function heroStyle() {
  if (state.choicesMade.usage === "ace") return "scorer";
  if (state.choicesMade.usage === "general") return "general";

  const h = hero();
  if (!h) return "none";
  const pass = calcDerived(h, DERIVED_STATS.find(d => d.key === "pass"));
  const drive = calcDerived(h, DERIVED_STATS.find(d => d.key === "drive"));
  const shoot = calcDerived(h, DERIVED_STATS.find(d => d.key === "shoot"));
  // 得点力と司令塔ぶり、どちらに寄っているか
  return (drive + shoot) / 2 > pass + 4 ? "scorer" : "general";
}

const STORY = [
  // ---- 4月 ----
  // cast は、その話に出てくる選手。画面に顔が並ぶ。
  // 「誰の話なのか」が絵で分かると、文章の入りが違う。
  {
    week: 0,
    variants: [{
      when: () => true,
      cast: ["赤星 蓮", "黒田 迅"],
      title: "第1話 始まりの春",
      text: () => `陽和(ひより)高校、男子バスケットボール部。
        体育館の半面。使えるボールは6つ、うち2つは空気が甘い。部員は8人。
        壁には去年の予定表が貼りっぱなしで、いちばん下に「県大会1回戦敗退」とだけ残っている。誰も剥がさない。剥がす理由もない。それが、この部の全てだった。
        
        入部初日。ぞろぞろと自己紹介が続く中で、いちばん体の細い1年生が、当たり前のことのように言った。
        「赤星蓮です。ポイントガードやります。——ウィンターカップ、行きましょう」
        
        体育館が、しんと静かになった。
        誰も笑わなかった。笑うほどの元気も、この部にはなかった。誰も頷きもしなかった。
        2年生の黒田だけが、転がってきたボールを拾い上げて、赤星を見ずに短く返した。
        「……口じゃなくて、足でやれ」
        突き放したようで、追い返してはいない。それが黒田という男の、精一杯の返事だった。`,
    }],
  },

  // ---- 5月：赤星が周りにどう見られているか ----
  {
    week: 4,
    variants: [
      {
        // 4月から赤星を優先して鍛えていれば、ここで届く
        when: () => heroMargin() >= 7.5,
        cast: ["赤星 蓮", "青木 樹", "黒田 迅"],
        title: "第2話 口だけではなかった",
        text: () => `1ヶ月で、体育館の空気が少し変わった。理由ははっきりしている。赤星のパスが、味方の手に気持ちよく収まるようになったからだ。
          走り込んだ先に、もうボールが置いてある。受け手はただ、シュートを打つだけでいい。
          
          シュート練習の列で、青木が涼しい顔のまま、隣の黒田にだけ聞こえる声で言った。
          「なあ。あいつ、1年だよな」
          「だったら何だ」
          「いや……別に。もらいやすいな、と思っただけ」
          青木はそれ以上言わなかった。手首だけは、いつも通り小刻みに動いている。
          黒田は答えなかった。だが、否定もしなかった。
          ——否定できなかった、が正しい。`,
        effect: () => setBuff(1.15, 2, "赤星に引っ張られている"),
      },
      {
        when: () => true,
        cast: ["赤星 蓮", "灰谷 悠"],
        title: "第2話 言葉と実力の距離",
        text: () => `威勢のいいことを言った1年生は、1ヶ月経っても、まだ何者でもなかった。
          パスは味方の指をすり抜け、当たればあっさり弾き飛ばされる。細い体が、床を何度も転がった。
          
          給水中、灰谷が困ったような、いつもの笑みで話しかけてきた。
          「赤星くん。さっき言ってたやつ……ウィンターカップ、だっけか」
          悪気はなかった。灰谷にはたぶん、悪気というものが、そもそもない。
          それがかえって刺さった。責められるより、優しく確認されるほうが、ずっと痛いことがある。
          「……行きます」
          赤星は短くそれだけ言った。灰谷は「うん」とだけ返して、それ以上は何も聞かなかった。
          その日、いちばん最後まで体育館に残ってシュートを打っていたのは、赤星だった。`,
      },
    ],
  },

  // ---- 6月：県大会前 ----
  {
    week: 8,
    variants: [
      {
        when: () => teamAvgOvr() >= 55,
        cast: ["紫藤 圭", "緑川 壮真"],
        title: "第3話 県大会前夜",
        text: () => `組み合わせが発表された。トーナメント表を指でたどると、勝ち進めば決勝で明星学園にぶつかる。走るバスケで県を何連覇もしている、王者だ。
          
          紫藤が分析ノートから顔を上げて、独り言のように呟いた。
          「明星のペース、去年より上がってるんですよね。……勝てますかね」
          誰も答えないと思っていた。
          だが、少し間があって、いつも黙っている緑川が、ぼそりと言った。
          「……今年は、分からんぞ」
          紫藤は思わず二度見した。緑川がこの1ヶ月で発した言葉の、たぶん全部を足したより長い。
          去年までのこの部でなら、誰も言わなかった台詞だった。`,
      },
      {
        when: () => true,
        cast: ["紫藤 圭", "赤星 蓮"],
        title: "第3話 県大会前夜",
        text: () => `組み合わせが発表された。勝ち進めば決勝で明星学園。県の王者で、去年うちを1回戦で沈めた相手でもある。
          
          「勝てますかね」と紫藤が、ノートの端を指で押さえながら聞いた。
          すぐには、誰も答えなかった。答えられる材料が、去年までのこの部にはなかった。
          しばらくして、赤星だけが、当たり前のことのように言った。
          「やってみないと、分からないでしょう」
          根拠のない言葉だった。でも、根拠がないから言えないというなら、この部は永遠に何も言えない。
          誰も同意しなかった。けれど、誰も止めもしなかった。それが、去年との違いだった。`,
      },
    ],
  },

  // ---- 7月：県大会の結果 × 赤星の活躍 ----
  {
    week: 12,
    variants: [
      {
        when: () => state.tournaments.kengun === "won" && hero()?.career.pts >= 30,
        cast: ["赤星 蓮", "黒田 迅"],
        title: "第4話 エースの誕生",
        text: () => `県大会優勝。その垂れ幕が、見慣れた体育館に、少しだけ誇らしげに下がった。
          決勝でいちばん点を取ったのは、4月に床を転がっていた1年生のポイントガードだった。
          
          片付けの終わった体育館で、赤星が黒田に近づいて、いたずらっぽく言った。
          「黒田さん。俺が初日に『行きましょう』って言ったの、覚えてます?」
          「……覚えてねえよ」
          「嘘ですね。今、目が泳ぎました」
          「うるせえ」
          黒田は舌打ちして横を向いたが、その口の端が、初めて少しだけ上がっていた。
          ——突き放すのが、下手になってきたな。とだけ、黒田は思った。`,
        effect: () => setBuff(1.2, 3, "全国出場が決まった高揚"),
      },
      {
        when: () => state.tournaments.kengun === "won",
        cast: ["黒田 迅", "赤星 蓮"],
        title: "第4話 全国への切符",
        text: () => `県大会優勝の垂れ幕が、体育館に下がった。
          その先にあるのは、全国大会——インターハイ。8人の誰ひとり、立ったことのない夏の舞台だ。組み合わせ抽選の紙が、部室の壁に貼られた。
          
          部員たちが「全国だぞ」「まじか」と浮ついている横で、黒田だけが腕を組んだまま、低く言った。
          「……浮かれてんじゃねえ。ここからだろ」
          場が、少し静かになる。
          赤星は言い返さなかった。ただ黙って頷いた。同じことを、ちょうど考えていたからだ。
          全国は、ゴールじゃない。冬まで続く長い坂の、最初の踊り場に過ぎない。`,
        effect: () => setBuff(1.2, 3, "全国出場が決まった高揚"),
      },
      {
        when: () => state.tournaments.kengun === "lost",
        cast: ["赤星 蓮"],
        title: "第4話 夏は来ない",
        text: () => `夏は、来なかった。
          県大会の決勝、あと一歩のところで足りなかった。最後のブザーが鳴った瞬間の、あの体育館の音の消え方を、たぶん全員が一生忘れない。
          相手の歓声も、味方の呼吸も、何もかもが遠かった。
          
          誰も動けずにいる中で、赤星がぽつりと言った。
          「……冬が、ある」
          声は震えていた。悔しさで、指先まで震えていた。それでも目だけは、不思議なくらい乾いていた。
          4月、同じ言葉を言ったときは、誰も本気にしなかった。
          今度は——誰も笑わなかった。むしろ、その一言に全員が掴まった。`,
        // 負けたほうが長く効く。悔しさのほうが、人を動かすから。
        effect: () => setBuff(1.2, 4, "夏に届かなかった悔しさ"),
      },
      {
        when: () => true,
        title: "第4話 過ぎていく夏",
        text: () => `県大会は終わった。垂れ幕は下がらず、下げる理由もなかった。
          悔しさも、達成感も、そこそこに。日々はいつも通り続いていく。
          ボールの空気は、今日もひとつ抜けている。`,
      },
    ],
  },

  // ---- 8月：夏。ここで部員が1人減ることがある ----
  {
    week: 16,
    variants: [
      {
        when: () => state.tournaments.kengun === "won",
        cast: ["赤星 蓮"],
        title: "第5話 夏",
        text: () => `合宿、そして全国大会。この1ヶ月で、チームは変わる。良い方にも、悪い方にも、はっきりと。
          出発の朝、監督は一言だけ言った。
          「ケガをしない範囲で、限界までやってこい」
          ——範囲がどこまでなのか、その線引きは、結局誰も教えてくれなかった。自分で探すしかない。
          
          合宿中、いちばん先に体育館の鍵を開けたのは赤星だった。そして夜、いちばん最後に電気を消したのも、赤星だった。
          「限界の範囲」を、たぶんこの男は毎日少しずつ、自分の手で押し広げていた。`,
      },
      {
        // 県大会で負け、チームも伸び悩んでいると、去る者が出る
        when: () => state.tournaments.kengun === "lost" && teamAvgOvr() < 60 && players.length > 6,
        // cast は関数にもできる。誰が去るかは、その場で決まるため。
        cast: () => [leastPlayed()?.name, "赤星 蓮", "紫藤 圭"],
        title: "第5話 去る者",
        text: () => {
          const quitter = leastPlayed();
          return `テレビの中で、全国大会が始まっていた。

            その週、${quitter.name}が部室に来なかった。次の日も来なかった。
            「受験、するらしいです」と紫藤が言った。それ以上、誰も何も言わなかった。

            8人だった部が、${players.length - 1}人になる。
            赤星はコートに残り、いつもより長くシュートを打っていた。`;
        },
        effect: () => {
          const quitter = leastPlayed();
          if (!quitter) return;
          // 誰が去ったかを覚えておく。冬に効いてくる。
          state.quitter = { name: quitter.name, pos: quitter.pos, year: quitter.year };
          removePlayer(quitter);
        },
      },
      {
        when: () => true,
        cast: ["赤星 蓮", "紫藤 圭"],
        title: "第5話 届かなかった夏",
        text: () => `全国に出る学校が、画面の中で走っている。同じ夏、似たような体育館、同じオレンジ色のボール。
          違うのはただ一つ、そこに自分たちがいないことだけだ。
          
          部室のテレビを、赤星がじっと見ていた。紫藤がおずおずと聞く。
          「……見てて、しんどくないですか。見なくていいんですよ、こんなの」
          赤星は画面から目を離さずに答えた。
          「見るんだよ。目に焼き付けとくんです。——冬、俺たちがあそこに立つんで」
          紫藤は何も言えず、結局、赤星の隣に座って、一緒に画面を見た。ノートは、開かなかった。`,
      },
    ],
  },

  // ---- 9月：全国の結果。強ければ転校生が来る ----
  {
    week: 20,
    variants: [
      {
        when: () => state.tournaments.national === "won",
        cast: ["鷲尾 陣", "赤星 蓮"],
        title: "第6話 日本一の夏",
        text: () => `日本一。インターハイ優勝。その3文字は、思ったよりずっと静かに、部室に置かれていた。
          トロフィーはあるのに、誰も騒がない。まだ冬が丸ごと残っているからだ。喜ぶのは、全部が終わってからでいい。
          
          9月のある朝、体育館に見慣れない大男が立っていた。長身で、肩幅が広く、猛禽類のような目をしている。
          「鷲尾 陣です。転校してきました」
          真顔だった。それから、付け足すように——
          「ここで、やりたくて」
          それだけだった。愛想もない代わりに、嘘もない声だった。全国を獲ったチームには、こういう男が、自分から集まってくる。
          
          「歓迎します。……でも、まだ半分ですよ」と赤星が言った。
          「ああ」と鷲尾は短く頷いた。誰も、その言葉に反論しなかった。`,
        effect: () => joinTransfer(),
      },
      {
        when: () => state.tournaments.national === "lost",
        cast: ["白石 大河", "赤星 蓮", "鷲尾 陣"],
        title: "第6話 全国の壁",
        text: () => `全国で見た景色の話を、部員たちは何度もした。何度話しても、話し足りなかった。
          中でも、優勝した帝王実業のシュートは、放物線からして自分たちのと違った。高く、静かで、当たり前みたいに落ちてくる。
          
          ぼんやりした顔で聞いていた白石が、ぽつりと言った。
          「……あれ、やるんだよ。おれ、跳べるし」
          誰かが笑いかけて、やめた。白石の目は、冗談を言っている目ではなかった。理屈は分かっていなくても、届きたい場所だけは、はっきり見えているらしい。
          
          その横で、赤星は何も言わず、ノートに何かを書き続けていた。誰にも、中身は見せなかった。
          
          そして9月、体育館に見慣れない大男が立っていた。
          「鷲尾 陣です」
          真顔のまま、彼はこう続けた。
          「全国で、お前らの試合を見ました。負けてたけど——目が、良かった」
          転校の理由は、それだけだった。それで十分だった。`,
        effect: () => {
          setBuff(1.15, 3, "全国で見た景色");
          joinTransfer();
        },
      },
      {
        when: () => true,
        cast: ["赤星 蓮"],
        title: "第6話 テレビの中の夏",
        text: () => `夏が終わった。テレビの中で誰かが日本一になり、テープを切り、泣いていた。全部が、遠い国の話のようだった。
          だが——冬は、まだ誰のものでもない。夏に手が届かなかったチームにも、冬の扉だけは、平等に開いている。
          
          ある日、体育館の壁に、いつの間にか一枚の紙が貼られていた。
          「ウィンターカップ」
          少し右上がりの、見覚えのある字だった。赤星の字だ。誰も、剥がさなかった。`,
      },
    ],
  },

  // ---- 10月：赤星がどんな選手になったか ----
  {
    week: 24,
    variants: [
      {
        when: () => heroStyle() === "scorer" && heroRank() === 1,
        cast: ["赤星 蓮", "黒田 迅"],
        title: "第7話 牙",
        text: () => `いつからか、いちばん苦しい時間帯にボールを持つのは、赤星になっていた。
          誰かが決めてくれと願う場面で、赤星はふっと前を向く。抜く。沈める。それだけのことを、もう誰にも止められない。
          
          タイムアウトのベンチで、黒田がタオルを首にかけたまま、ぶっきらぼうに言った。
          「……最後、お前に預けりゃいいんだろ。もう」
          「え」
          「聞こえてんだろ。二度言わせんな」
          それが、この不器用な先輩なりの最上級の信頼だと気づくのに、赤星は少しかかった。気づいたときには、黒田はもう背を向けていた。
          
          司令塔が牙を持つと、チームは別の生き物になる。
          
          ── 赤星 蓮 が「牙」を習得した`,
        // 話が形になったら、それを技能として残す。
        // 文章だけで終わらせず、試合の数字に効かせる。
        effect: () => giveHeroSkill("FANG"),
      },
      {
        when: () => heroStyle() === "general" && heroRank() <= 2,
        cast: ["赤星 蓮", "緑川 壮真"],
        title: "第7話 司令塔",
        text: () => `赤星のパスが、味方の一歩先——正確には、味方が「これから行く場所」に置かれるようになった。
          受け手はただ走り込むだけでいい。走れば、そこにもうボールがある。それだけで得点になる、そういうパスだ。
          
          練習後、いつもは何も言わない緑川が、自分のところに来た絶妙なパスを思い出したのか、ぼそりと聞いた。
          「……見えてんのか。あれが」
          「見えてますよ」
          赤星は、水を飲むのと同じ調子で、当たり前のように答えた。
          緑川は少し黙って、それから小さく「そうか」とだけ言って、また口を閉じた。この男が二往復も喋ったのは、たぶん今年で、数えるほどしかない。
          
          ── 赤星 蓮 が「司令塔」を習得した`,
        effect: () => giveHeroSkill("GENERAL"),
      },
      {
        when: () => true,
        cast: ["赤星 蓮"],
        title: "第7話 秋",
        text: () => `体育館の窓が、少しずつ白く曇り始める季節になった。ボールをつく音が、前より低く、重く響く。
          4月にはできなかったことが、いつの間にか、当たり前にできるようになっている。転がってばかりだった体は、もう簡単には飛ばされない。
          けれど成長というのは不思議なもので、渦中にいる者には、いちばん見えにくい。変わったことに、本人だけが気づいていない。
          
          赤星は今日も、いちばん最後に体育館を出て、後ろ手に電気を消した。暗くなった体育館に、「ウィンターカップ」の紙だけが、白く浮かんでいた。`,
      },
    ],
  },

  // ---- 11月：チームの仕上がり ----
  {
    week: 28,
    variants: [
      {
        when: () => teamAvgOvr() >= 64,
        cast: ["灰谷 悠", "赤星 蓮"],
        title: "第8話 仕上がり",
        text: () => `ウィンターカップまで、あと8週。
          練習試合の相手は、格上だった。去年の自分たちなら、手も足も出ずに20点差はついていた相手だ。
          ——勝った。しかも、終盤で突き放しての勝ちだった。
          
          引き上げの列で、灰谷がいつもの穏やかな調子で、誰にともなく言った。
          「……強くなったな、うち」
          派手な言葉じゃない。声も大きくない。でも、いちばん長くこの部にいる灰谷が言うと、妙に重みがあった。
          誰も否定しなかった。否定できる者が、もう一人もいない。それが、答えだった。`,
      },
      {
        when: () => true,
        cast: ["紫藤 圭", "赤星 蓮"],
        title: "第8話 残り2ヶ月",
        text: () => `ウィンターカップまで、あと8週。
          ここまで来ると、新しく足せることは、もう多くない。8ヶ月ぶんの積み重ねを、本番までに確かなものにする。やるのは、それだけだ。
          
          ノートを睨んでいた紫藤が、不安を隠さずに聞いた。
          「……全部、間に合いますかね。まだ詰めきれてないところ、あるんですけど」
          赤星は、迷いのない声で返した。
          「間に合うか、じゃない。間に合わせるんですよ」
          紫藤は少し笑って、「……ですよね」とノートに何か書き足した。この1年で、赤星のこういう言い方には、だいぶ慣れた。`,
      },
    ],
  },

  // ---- 12月：最終話 ----
  {
    week: 32,
    variants: [
      {
        // チームも仕上がり、赤星もチーム最上位でいるとき。
        // 「宣言した本人が本当にチームを引っ張った」ときだけの最終話。
        when: () => teamAvgOvr() >= 63 && heroRank() === 1,
        cast: () => players.map(p => p.name), // 最終話は全員の顔を並べる
        title: "第9話 あの日の言葉",
        text: () => `あと4週。
          
          4月、体育館の隅で、誰ひとり相手にしなかった1年生の言葉がある。
          「ウィンターカップ、行きましょう」——あれが今、この部の、全員の目標になっている。
          そして言い出した本人は、8ヶ月かけて、チームでいちばん上手い選手になった。口だけの男が、いちばん足で語る男に変わった。
          
          最後の全体ミーティング。円になった真ん中で、赤星がいつものように、静かに言った。
          「——行きましょう」
          黒田が鼻を鳴らし、青木が肩をすくめ、桃井が「はいっ」と誰より先に返事をし、白石が一拍遅れて頷き、紫藤がノートを閉じ、灰谷が穏やかに笑い、緑川が黙って顎を引いた。
          今度は、全員が頷いた。4月とは、何もかもが違っていた。`,
      },
      {
        when: () => true,
        cast: () => players.map(p => p.name),
        title: "第9話 12月",
        text: () => `あと4週。
          
          4月に赤星が言ったあの言葉を、今はもう、誰も笑わない。笑うどころか、全員がその一言に向かって、8ヶ月を使ってきた。
          自分たちが本当に強いのかどうかは、正直、まだ分からない。全国には、化け物みたいな学校がいくつもある。
          ただ一つだけ、確かなことがある。4月には空っぽだったこの体育館に、今は8ヶ月ぶんの何かが、確かに積もっている。
          それを持って、冬へ行く。`,
      },
    ],
  },
];

// その週のストーリー（なければ null）
function getStory(week) {
  return STORY.find(s => s.week === week) || null;
}

// 条件に合う最初の分岐を選ぶ
function pickVariant(story) {
  return story.variants.find(v => v.when()) || null;
}


// ---- 1.6 部員が減る／増える --------------------------

// いちばん出番がなく、いちばん能力の低い部員。退部イベントで使う。
function leastPlayed() {
  const candidates = players.filter(p => p.name !== HERO);
  if (!candidates.length) return null;
  return candidates.slice().sort((a, b) => {
    // 出場時間が少ない順、それも同じなら能力が低い順
    if (a.career.min !== b.career.min) return a.career.min - b.career.min;
    return calcOvr(a) - calcOvr(b);
  })[0];
}

// 主人公に技能を持たせる（10月の話で使う）
function giveHeroSkill(key) {
  const h = hero();
  if (!h || h.skills.includes(key)) return;
  h.skills.push(key);
}

// 転校生。夏に全国へ出た学校には、人が集まってくる。
//
// 能力を固定値で書くと、9月に入ってくる頃には部の全員に抜かれていて、
// 「全国で戦うチームでやりたくて来た実力者」がベンチ最下位になる。
// だから、そのときのチームを基準にして作る。
// TRANSFER_SHAPE は「チームの平均から見て、どこがどれだけ上か」。
const TRANSFER = {
  name: "鷲尾 陣", pos: "SF", year: 2,
  growth: { power: 1.1, speed: 1.2, stamina: 1.0, jump: 1.2, tech: 1.1, iq: 1.0 },
  durable: 1.2,
};

// 跳べて走れるウイング。頭脳より身体で来たタイプ。
// 合計が大きめなので、加入した時点で主力5人に入る。
const TRANSFER_SHAPE = {
  power: +8, speed: +8, stamina: +5, jump: +14, tech: +7, iq: +2,
};

// 部員全員の、基礎パラメータの平均。転校生の物差しになる。
function teamBaseLevel() {
  if (!players.length) return 50;
  let total = 0;
  for (const player of players) {
    for (const stat of BASE_STATS) total += player.base[stat.key];
  }
  return total / (players.length * BASE_STATS.length);
}

function joinTransfer() {
  if (getPlayer(TRANSFER.name)) return null; // すでにいる

  const level = teamBaseLevel();
  const base = {};
  for (const stat of BASE_STATS) {
    base[stat.key] = Math.min(100, Math.round(level + TRANSFER_SHAPE[stat.key]));
  }

  const player = addPlayer({ ...TRANSFER, base });
  player.skills.push("REBOUNDER");
  return player;
}


// ---- 1.7 選択式イベント ------------------------------
//
// 決まった週に、プレイヤーが自分で選ぶ。
// ランダムイベントと違い「自分で決めた」という手応えが残るので、
// 効果は大きめにしてある。選んだ結果は state.choicesMade に残り、
// 後のストーリーがそれを見る。
const CHOICES = [
  {
    key: "captain", week: 1,
    title: "主将を決める",
    text: `監督が部員を集めて言った。「主将を決める。誰がいい」
      去年までの主将は卒業した。誰も名乗り出ない。
      監督はしばらく待ってから、こちらを見た。`,
    options: [
      {
        key: "kuroda",
        label: "黒田 迅（2年）",
        desc: "順当。全員のバスケIQ +2、4週間まとまりが出る（練習効率+10%）",
        effect: () => {
          for (const p of players) p.base.iq = Math.min(100, p.base.iq + 2);
          setBuff(1.1, 4, "主将・黒田がまとめている");
          return `黒田が主将になった。「面倒だな」と言いながら、次の日から誰より早く来ている。`;
        },
      },
      {
        key: "akaboshi",
        label: "赤星 蓮（1年）",
        desc: "異例の抜擢。赤星のIQ +4 と成長率上昇。ただし2年生は面白くない（疲労+12）",
        effect: () => {
          const h = hero();
          h.base.iq = Math.min(100, h.base.iq + 4);
          h.growth.iq = Math.min(1.5, h.growth.iq + 0.15);
          for (const p of players) {
            if (p.year === 2) p.fatigue = Math.min(100, p.fatigue + 12);
          }
          return `1年生が主将になった。2年生は何も言わなかった。
            言わないことが、何よりも雄弁だった。`;
        },
      },
    ],
  },
  {
    key: "camp", week: 15,
    title: "夏合宿の方針",
    text: `来週から夏合宿。監督が方針を聞いてきた。
      「1週間でチームは変わる。どう変えたい」`,
    options: [
      {
        key: "hard",
        label: "徹底的に追い込む",
        desc: "3週間 練習効率+35%。ただし全員の疲労が一気に+12。ケガ人が出るかもしれない",
        effect: () => {
          setBuff(1.35, 3, "合宿で追い込む方針");
          for (const p of players) p.fatigue = Math.min(100, p.fatigue + 12);
          return `「限界までやれ」と監督は言った。冗談ではなかった。`;
        },
      },
      {
        key: "skill",
        label: "技術を詰める",
        desc: "全員のテクニック +4。3週間 練習効率+10%。安全だが劇的でもない",
        effect: () => {
          for (const p of players) p.base.tech = Math.min(100, p.base.tech + 4);
          setBuff(1.1, 3, "合宿で技術を詰めた");
          return `走るより、手を動かした1週間だった。地味だが、確かに残った。`;
        },
      },
      {
        key: "safe",
        label: "故障者を出さない",
        desc: "全員の疲労 -25。伸びないが、誰も欠けずに夏を越える",
        effect: () => {
          for (const p of players) p.fatigue = Math.max(0, p.fatigue - 25);
          return `「全員でコートに立つのが最低条件だ」と監督は言った。
            物足りない顔をした者も、何人かいた。`;
        },
      },
    ],
  },
  {
    key: "usage", week: 23,
    title: "赤星の起用法",
    text: `監督に呼ばれた。「赤星をどう使う」
      1年生は、もうこのチームの中心にいる。問題は、何の中心かだ。`,
    options: [
      {
        key: "ace",
        label: "エースとして点を取らせる",
        desc: "赤星のテクニック+5・スピード+3、テクニック成長率上昇。彼が試合を決める形になる",
        effect: () => {
          const h = hero();
          h.base.tech = Math.min(100, h.base.tech + 5);
          h.base.speed = Math.min(100, h.base.speed + 3);
          h.growth.tech = Math.min(1.5, h.growth.tech + 0.1);
          return `「お前が決めろ」と監督は言った。
            赤星は頷いた。断らなかったことが、答えだった。`;
        },
      },
      {
        key: "general",
        label: "司令塔として組み立てさせる",
        desc: "赤星のバスケIQ+7とIQ成長率上昇、さらに全員のIQ+1。チーム全体が噛み合う",
        effect: () => {
          const h = hero();
          h.base.iq = Math.min(100, h.base.iq + 7);
          h.growth.iq = Math.min(1.5, h.growth.iq + 0.1);
          for (const p of players) {
            if (p !== h) p.base.iq = Math.min(100, p.base.iq + 1);
          }
          return `「お前が全員を活かせ」と監督は言った。
            赤星は少しだけ考えて、頷いた。`;
        },
      },
    ],
  },
];

// その週の選択イベント（まだ選んでいないものだけ）
function getChoice(week) {
  const choice = CHOICES.find(c => c.week === week);
  if (!choice || state.choicesMade[choice.key]) return null;
  return choice;
}


// ---- 2. 特殊技能 -------------------------------------
// 試合で効く。match.js が参照する。
// stat     : 試合中の能力にそのまま上乗せ
// pickMult : その能力での抽選のときに重みを何倍にするか
//            （＝ボールが集まる、リバウンドを拾える）
// episode は選手詳細ページ（マネージャーの手帳）に出る一場面。
// 効果の説明が desc、それがどう見えるかが episode。
// 引数の call は呼び方（ふつうは「◯◯くん」、灰谷だけ「ゆうちゃん」）。
const SKILLS = {
  CLUTCH: {
    name: "勝負強さ", icon: "🔥",
    desc: "第4Qに化ける。終盤の得点力とシュート精度が上がる。",
    clutch: true,
    episode: call => `第4Qになると、${call}の顔つきが、ぐにゃっと変わるんです。
      何がどう変わったのか、言葉では説明できないんですけど、ベンチから見てると、はっきり分かります。
      「あ、スイッチ入った」って。あれが入った日は、たいてい勝ちます。`,
  },
  REBOUNDER: {
    name: "リバウンド職人", icon: "💪",
    desc: "リバウンドへの嗅覚。ボールが手元に落ちてくる。",
    stat: { rebound: 4 },
    pickMult: { rebound: 2.0 },
    episode: call => `どこに落ちてくるか、分かるらしいです。
      「見えるから」って${call}は言うんですけど、普通は見えないですよ、あんなの。
      ボールのほうが、${call}の手を選んで落ちてきてる気さえします。`,
  },
  STEALER: {
    name: "読みの鋭さ", icon: "👁",
    desc: "パスコースを読む。スティールが増える。",
    stat: { defense: 4 },
    pickMult: { defense: 2.0 },
    episode: call => `練習中も、先輩のパスを平気でカットするので、よく怒られてます。
      ${call}、悪気はないんです。見えちゃうだけなんです。
      「取るなよ、味方のを」って言われて、キョトンとしてました。区別、ついてないのかもしれません。`,
  },
  SHOOTER: {
    name: "3Pの申し子", icon: "🎯",
    desc: "外から沈める。シュート力が跳ね上がる。",
    stat: { shoot: 7 },
    pickMult: { shoot: 1.6 },
    episode: call => `「手を離れた瞬間に、入るのが分かる」って言うんです。
      嘘でしょって思ったんですけど、${call}の場合、本当に入るんですよね。
      だから、たまに外したときの「あれ?」って顔が、ちょっと面白いです。`,
  },
  TOUGH: {
    name: "タフガイ", icon: "🛡",
    desc: "試合中に消耗しにくい。40分走り切れる。",
    stat: { stamina: 4 },
    fatigueMult: 0.7,
    episode: call => `40分走りきって、平気な顔で、おかわりしてました。ご飯を。
      ${call}の体、どうなってるんでしょう。エンジン、二つ積んでるのかもしれません。`,
  },
  GENERAL: {
    name: "司令塔", icon: "🧠",
    desc: "コート上の監督。パスと判断が一段上がる。",
    stat: { pass: 6, iq: 4 },
    pickMult: { pass: 1.6 },
    episode: call => `監督が指示を出す前に、${call}が、もう同じことを言ってます。
      コートの上に、監督がもう一人いるみたいです。おかげで監督、最近ちょっと暇そうです。`,
  },

  // 10月の「赤星の起用法」で決まる、主人公専用の技能。
  // 司令塔（GENERAL）と対になる、もう一方の道。
  FANG: {
    name: "牙", icon: "🗡",
    desc: "苦しい場面を自分でこじ開ける。1on1の決定力が跳ね上がる。",
    // ストーリーでしか手に入らない。ランダムで誰かが覚えたら、
    // 「赤星が選んだ道」という意味がなくなる。
    storyOnly: true,
    stat: { drive: 7, shoot: 4 },
    pickMult: { drive: 1.8 },
    episode: call => `苦しい時間帯、みんなが${call}を見るようになりました。「頼む」って顔で。
      本人も、見られることを、嫌がらなくなりました。むしろ、待ってる節すらあります。
      ……変わったなあ、と思います。頼られるのって、重いはずなのに。`,
  },
};

function hasSkill(unit, key) {
  return Boolean(unit.skills && unit.skills.includes(key));
}


// ---- 2.5 試合での技能習得 ----------------------------
//
// 練習ではなく、試合で掴むもの。
// 条件は「その試合で実際に何をしたか」。20点取った選手がシューターの目を持ち、
// 10本拾った選手がリバウンドの嗅覚を得る。数字が先で、技能が後からついてくる。
//
// 条件を満たしても確実には身につかない。練習試合で10%、公式戦で20%。
// 公式戦のほうが高いのは、緊張感の中で掴んだものは残るから。
const MATCH_SKILLS = [
  {
    key: "SHOOTER",
    need: box => box.pts >= 20,
    label: "1試合20点以上",
    story: name => `「今日、なんか入る気しかしなかったです」と${name}は言いました。
      ああいう日を1回経験すると、人は変わるみたいです。`,
  },
  {
    key: "REBOUNDER",
    need: box => box.reb >= 10,
    label: "1試合10リバウンド以上",
    story: name => `10本です。10本。ずっと同じ場所に立ってただけみたいな顔してましたけど。
      ${name}、たぶん見えてます。`,
  },
  {
    key: "GENERAL",
    need: box => box.ast >= 8,
    label: "1試合8アシスト以上",
    story: name => `${name}のパスで点が入り続けた試合でした。
      あれ、味方が上手くなったんじゃなくて、${name}が上手くなったんだと思います。`,
  },
  {
    key: "STEALER",
    need: box => box.stl >= 4,
    label: "1試合4スティール以上",
    story: name => `相手のパス、4本も切りました。読んでるとしか思えません。
      ${name}は「なんとなく」って言うんですけど。`,
  },
  {
    key: "CLUTCH",
    // 接戦を勝ち切った試合で、フル出場して点を取った選手
    need: (box, ctx) => ctx.win && ctx.margin <= 5 && box.min >= 4 && box.pts >= 12,
    label: "5点差以内の勝利で、フル出場かつ12点以上",
    story: name => `最後の最後、全部${name}のところにボールが行きました。
      逃げなかったんです。あれは、もう持ってる人の動きです。`,
  },
  {
    key: "TOUGH",
    // 疲れ切ってもフル出場し続けた選手。
    // 万全で入った試合ではまず届かない（4Qでだいたい疲労65前後）。
    // 大会の連戦や、疲れたまま組んだ練習試合でだけ起きる。
    need: (box, ctx) => box.min >= 4 && ctx.endFatigue >= 70,
    label: "疲労70以上でフル出場",
    story: name => `もう足が止まってるのに、最後まで下がりませんでした。
      ${name}、次の日けろっとしてました。どうなってるんでしょう。`,
  },
];

// 試合1つぶんの技能判定。
// ctx = { win, margin, official, endFatigue }
function rollMatchSkills(player, box, ctx) {
  // 1人が1試合で覚えるのは1つまで。まとめて生えると安っぽくなる。
  if (player.skills.length >= 3) return null;

  const chance = ctx.official ? 0.20 : 0.10;

  for (const entry of MATCH_SKILLS) {
    if (player.skills.includes(entry.key)) continue;
    if (!entry.need(box, ctx)) continue;
    if (Math.random() >= chance) continue;

    player.skills.push(entry.key);
    return {
      player, key: entry.key, label: entry.label,
      story: entry.story(callName(player)),
    };
  }
  return null;
}


// ---- 3. 特殊イベントのための小道具 --------------------

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 練習に参加できる選手（故障中を除く）
function activePlayers() {
  return players.filter(p => p.injuryWeeks === 0);
}

// ランダムにn人選ぶ（数名イベント用）
function randomFew(n, pool) {
  const list = [...(pool ?? activePlayers())].sort(() => Math.random() - 0.5);
  return list.slice(0, n);
}

// 「赤星・青木」のように名前を並べる
function names(list) {
  return list.map(p => p.name).join("・");
}

// 練習効率のバフ／デバフをかける
function setBuff(mult, weeks, text) {
  state.buff = { mult, weeks, text };
}


// ---- 4. 特殊イベント ---------------------------------
// weight : 抽選の重み。大きいほど起きやすい。数値でも関数でもいい。
// scope  : 誰の話か。"single"（1人）/ "few"（数名）/ "team"（部全体）
// can()  : 起こせる状況かどうか（例: 覚える技能が残っているか）
// run()  : 効果を実行し、{ text, story } を返す。
//            text  … 何が起きたか（効果の要約）
//            story … その一場面。数字だけでは部が続いている感じが出ないため。
//
// 新しいイベントを足したければ、この配列に1つ書き足すだけでいい。
const RANDOM_EVENTS = [
  // ---- 1人のイベント ----
  {
    key: "knack", weight: 8, good: true, scope: "single",
    can: () => activePlayers().length > 0,
    run: () => {
      const player = randomOf(activePlayers());
      const stat = randomOf(BASE_STATS);
      const gain = 3 + Math.floor(Math.random() * 3);
      player.base[stat.key] = Math.min(100, player.base[stat.key] + gain);
      return {
        text: `${player.name} が${stat.label}のコツを掴んだ。${stat.label} +${gain}`,
        story: `同じ動きを何百回も繰り返したある日、${player.name}の体が勝手に正解を選んだ。`,
      };
    },
  },
  {
    key: "growth", weight: 5, good: true, scope: "single",
    can: () => activePlayers().some(p => p.year === 1),
    run: () => {
      const player = randomOf(activePlayers().filter(p => p.year === 1));
      player.base.power = Math.min(100, player.base.power + 5);
      player.base.jump = Math.min(100, player.base.jump + 3);
      return {
        text: `${player.name} の体が一回り大きくなった。パワー +5 ジャンプ +3`,
        story: `「お前、背伸びたか」と先輩に言われて、${player.name}は初めて気づいた。`,
      };
    },
  },
  {
    key: "awaken", weight: 3, good: true, scope: "single",
    can: () => activePlayers().length > 0,
    run: () => {
      const player = randomOf(activePlayers());
      const stat = randomOf(BASE_STATS);
      const gain = 7 + Math.floor(Math.random() * 4);
      player.base[stat.key] = Math.min(100, player.base[stat.key] + gain);
      return {
        text: `⚡ ${player.name} が覚醒した！ ${stat.label} +${gain}`,
        story: `何かが噛み合った。本人にも説明できない。ただ、昨日までとは違う。`,
      };
    },
  },
  {
    key: "talent", weight: 5, good: true, scope: "single",
    // まだ伸びしろのある成長率だけを上げる（青天井にしない）
    can: () => activePlayers().some(p => Object.values(p.growth).some(g => g < 1.5)),
    run: () => {
      const candidates = activePlayers().filter(p => Object.values(p.growth).some(g => g < 1.5));
      const player = randomOf(candidates);
      const stat = randomOf(BASE_STATS.filter(s => player.growth[s.key] < 1.5));
      player.growth[stat.key] = Math.min(1.5, player.growth[stat.key] + 0.15);
      return {
        text: `${player.name} の${stat.label}の成長率が上がった（${player.growth[stat.key].toFixed(2)}）`,
        story: `「これ、何のためにやってるか分かるか」と聞かれて、${player.name}は答えられた。`,
      };
    },
  },
  {
    key: "skill", weight: 9, good: true, scope: "single",
    can: () => activePlayers().some(p => p.skills.length < 2),
    run: () => {
      const player = randomOf(activePlayers().filter(p => p.skills.length < 2));
      const keys = Object.keys(SKILLS)
        .filter(k => !SKILLS[k].storyOnly && !player.skills.includes(k));
      if (!keys.length) return null;
      const key = randomOf(keys);
      player.skills.push(key);
      return {
        text: `★ ${player.name} が「${SKILLS[key].name}」を習得した！`,
        story: `${SKILLS[key].desc} 気づけば、それが${player.name}の武器になっていた。`,
      };
    },
  },

  // ---- 数名のイベント ----
  // 部活は個人の集まりではない。誰かと誰かの間に起きることがある。
  {
    key: "latenight", weight: 7, good: true, scope: "few",
    can: () => activePlayers().length >= 2,
    run: () => {
      const two = randomFew(2);
      for (const player of two) {
        player.base.tech = Math.min(100, player.base.tech + 3);
        player.fatigue = Math.min(100, player.fatigue + 8);
      }
      return {
        text: `${names(two)} が居残り練習。テクニック +3（疲労 +8）`,
        story: `消灯時間を過ぎても、ボールの音だけが体育館に残っていた。`,
      };
    },
  },
  {
    key: "teach", weight: 7, good: true, scope: "few",
    // 教える側と教わる側。2年生と1年生が揃っているときだけ起きる。
    can: () => activePlayers().some(p => p.year === 2) && activePlayers().some(p => p.year === 1),
    run: () => {
      const senior = randomOf(activePlayers().filter(p => p.year === 2));
      const junior = randomOf(activePlayers().filter(p => p.year === 1));
      junior.base.tech = Math.min(100, junior.base.tech + 4);
      senior.base.iq = Math.min(100, senior.base.iq + 3);
      return {
        text: `${senior.name} が ${junior.name} に指導。${junior.name} テクニック +4／${senior.name} バスケIQ +3`,
        story: `教えるほうが学ぶことは多い。${senior.name}は説明しながら、自分の癖に気づいた。`,
      };
    },
  },
  {
    key: "morning", weight: 6, good: true, scope: "few",
    can: () => activePlayers().length >= 3,
    run: () => {
      const three = randomFew(3);
      for (const player of three) {
        player.base.stamina = Math.min(100, player.base.stamina + 3);
      }
      return {
        text: `${names(three)} が自主的に朝練を始めた。スタミナ +3`,
        story: `誰が言い出したわけでもない。ある朝、3人が同じ時間に体育館にいた。`,
      };
    },
  },
  {
    key: "duo", weight: 5, good: true, scope: "few",
    can: () => activePlayers().length >= 2,
    run: () => {
      const two = randomFew(2);
      for (const player of two) {
        player.base.iq = Math.min(100, player.base.iq + 4);
      }
      return {
        text: `${names(two)} の連携が噛み合ってきた。バスケIQ +4`,
        story: `声を出さなくても、次にどこへ動くか分かる。そういう相手が1人いるだけで、コートは変わる。`,
      };
    },
  },
  {
    key: "quarrel", weight: 4, good: false, scope: "few",
    can: () => activePlayers().length >= 2,
    run: () => {
      const two = randomFew(2);
      for (const player of two) {
        player.fatigue = Math.min(100, player.fatigue + 18);
      }
      return {
        text: `⚠ ${names(two)} が練習中に衝突。疲労 +18`,
        story: `本気だからぶつかる。分かっていても、その日の練習は重かった。`,
      };
    },
  },

  // ---- 部全体のイベント ----
  {
    key: "coach", weight: 5, good: true, scope: "team",
    can: () => !state.buff,
    run: () => {
      setBuff(1.3, 2, "コーチの指導が冴えている");
      return {
        text: `コーチが良い指導法を掴んだ。今後2週、練習効率 +30%`,
        story: `「やり方を変える」と監督は言った。理由は説明されなかったが、体は正直だった。`,
      };
    },
  },
  {
    key: "ob", weight: 5, good: true, scope: "team",
    can: () => activePlayers().length > 0,
    run: () => {
      for (const player of activePlayers()) {
        player.base.iq = Math.min(100, player.base.iq + 2);
      }
      return {
        text: `OBが練習に顔を出した。全員のバスケIQ +2`,
        story: `10年前にこの体育館にいた人が、今も同じ場所の話をしていく。`,
      };
    },
  },
  {
    key: "care", weight: 6, good: true, scope: "team",
    can: () => players.some(p => p.fatigue > 30),
    run: () => {
      for (const player of players) {
        player.fatigue = Math.max(0, player.fatigue - 18);
      }
      return {
        text: `トレーナーが手厚くケアしてくれた。全員の疲労 -18`,
        story: `体を診てもらうのも練習のうちだ、と誰かが言っていた。`,
      };
    },
  },
  {
    key: "cold", weight: 4, good: false, scope: "few",
    can: () => activePlayers().length >= 2,
    run: () => {
      const two = randomFew(2);
      for (const player of two) {
        player.fatigue = Math.min(100, player.fatigue + 25);
      }
      return {
        text: `⚠ 風邪が流行った。${names(two)} の疲労 +25`,
        story: `一人が咳をし始めると、部室はあっという間だった。`,
      };
    },
  },
  {
    key: "slump", weight: 3, good: false, scope: "team",
    can: () => !state.buff,
    run: () => {
      setBuff(0.75, 2, "チームの空気が重い");
      return {
        text: `⚠ 部内の雰囲気が悪い。今後2週、練習効率 -25%`,
        story: `理由は誰にも分からない。ただ、ボールが手につかない日が続いた。`,
      };
    },
  },
];

// ---- 4.5 特殊戦術の習得 -------------------------------

// 特殊戦術ぜんぶ（習得済みも含む）
function allSpecialTactics() {
  const all = { ...OFF_TACTICS, ...DEF_TACTICS };
  return Object.keys(all).filter(k => all[k].locked);
}

// まだ習得していない特殊戦術
function lockedTactics() {
  return allSpecialTactics().filter(k => !state.unlocked.includes(k));
}

function getTactic(key) {
  return OFF_TACTICS[key] || DEF_TACTICS[key];
}

// チームが「その戦術をどれだけ使える状態か」を 0〜1 で返す。
//   min未満  → 0（まだ話にならない）
//   full以上 → 1（いつ習得してもおかしくない）
// この数字がそのまま習得のしやすさになる。
function tacticReadiness(key) {
  const unlock = getTactic(key).unlock;
  const value = unlock.value();
  const ratio = (value - unlock.min) / (unlock.full - unlock.min);
  return Math.max(0, Math.min(1, ratio));
}

// 準備が整っている戦術ほど選ばれやすい抽選
function pickByReadiness(keys) {
  const total = keys.reduce((sum, k) => sum + tacticReadiness(k), 0);
  let r = Math.random() * total;
  for (const key of keys) {
    r -= tacticReadiness(key);
    if (r <= 0) return key;
  }
  return keys[keys.length - 1];
}

// その戦術を「今週」習得できる確率。
// 条件を完全に満たしていれば 40%/週 なので、2〜3週あれば身につく。
const UNLOCK_RATE = 0.4;

function tacticChance(key) {
  return tacticReadiness(key) * UNLOCK_RATE;
}

// 特殊戦術の習得判定。毎週かならず行う。
//
// 以前はこれを15種類あるイベント抽選の1枠に入れていた。
// その結果、条件を100%満たしていても実際の習得率は週8%ほどしかなく、
// 「習得しやすさ100%」と表示しながら1年間習得できないことが起きた。
// 表示した数字が起きることと食い違っていたので、抽選から独立させた。
function checkTacticUnlock() {
  for (const key of lockedTactics()) {
    if (Math.random() >= tacticChance(key)) continue;

    state.unlocked.push(key);
    const tactic = getTactic(key);
    return {
      text: `★ 新しい戦術「${tactic.name}」を習得した！`,
      story: `${tactic.unlock.label}が、ようやく形になった。これで戦い方が1つ増えた。`,
      good: true,
      scope: "team",
    };
  }
  return null;
}

// 重みは数値でも関数でもいい。
// 関数にすると「チームの状態によって起きやすさが変わる」を表現できる。
function eventWeight(event) {
  return typeof event.weight === "function" ? event.weight() : event.weight;
}

// 毎週の抽選。45%の確率で何かが起きる。
// 36週なので、1シーズンでおよそ16件。多すぎず、忘れた頃に来る間隔。
function rollRandomEvent() {
  if (Math.random() > 0.45) return null;

  // 今の状況で起こせるものだけを候補にする
  const pool = RANDOM_EVENTS.filter(e => e.can() && eventWeight(e) > 0);
  if (!pool.length) return null;

  const total = pool.reduce((sum, e) => sum + eventWeight(e), 0);
  let r = Math.random() * total;
  for (const event of pool) {
    r -= eventWeight(event);
    if (r <= 0) {
      const result = event.run();
      if (!result) return null;
      return { ...result, good: event.good, scope: event.scope };
    }
  }
  return null;
}

// 月頭のストーリーを進める。
// 4月1週目の話はゲーム開始時にも出すので、
// 「一度出した話は二度と出さない」を覚えておかないと、
// 最初の週送りで同じ話がもう一度流れてしまう（効果も二重にかかる）。
function runStory() {
  const story = getStory(state.week);
  if (!story || state.storySeen.includes(story.week)) return null;

  const variant = pickVariant(story);
  if (!variant) return null;

  state.storySeen.push(story.week);

  // 文章と登場人物を先に作り、効果はその後にかける。順番が逆だと、
  // 「去る者」の話で退部処理が先に走り、本文が別の部員を指してしまう。
  // 顔を並べるほうも同じで、先に名前を確定させないと、
  // 去っていく本人の顔がその話に出せなくなる。
  const text = variant.text();
  const cast = (typeof variant.cast === "function" ? variant.cast() : variant.cast) ?? [];

  if (variant.effect) variant.effect();

  return { title: variant.title, text, cast: cast.filter(Boolean) };
}

// バフの残り週数を減らす
function tickBuff() {
  if (!state.buff) return;
  state.buff.weeks--;
  if (state.buff.weeks <= 0) state.buff = null;
}


// ---- 5. カレンダー -----------------------------------
// 4月から12月まで、1ヶ月4週で並べる。先の予定が見えるから計画が立てられる。
// 画面が狭いとき、9ヶ月ぶん36マスを詰め込むとマスが潰れて何も読めない。
// 「今どのへんか」と「次に何が来るか」さえ分かればいいので、
// 狭い画面では今の前後だけを見せ、週が進むと先が現れるようにする。
//
// 過去を1ヶ月ぶん残すのは、「もう終わった大会」の結果を見返せるようにするため。
function visibleMonths() {
  const total = 9;
  if (window.innerWidth > 640) return { from: 0, to: total }; // パソコンは全部見せる

  const nowMonth = Math.floor(state.week / 4);
  const from = Math.max(0, Math.min(nowMonth - 1, total - 4));
  return { from, to: Math.min(total, from + 4) };
}

function renderCalendar() {
  const box = document.getElementById("calendar");
  const range = visibleMonths();
  const hidden = 9 - (range.to - range.from);

  const months = [];
  for (let m = range.from; m < range.to; m++) {
    const monthLabel = ((3 + m) % 12) + 1;

    const cells = [];
    for (let w = 0; w < 4; w++) {
      const week = m * 4 + w;
      const item = getScheduleItem(week);
      const isNow = week === state.week;
      const isPast = week < state.week;

      // 大会は結果が出たら色を変える（勝ち抜いた／敗退した）
      const result = item?.tournament ? state.tournaments[item.tournament.key] : null;

      const classes = [
        "cal-cell",
        item ? `cal-${item.type}` : "",
        result ? `cal-${result}` : "",
        isNow ? "now" : "",
        isPast ? "past" : "",
      ].join(" ");

      const title = item
        ? `${monthLabel}月${w + 1}週 ${item.name} — ${item.desc}`
        : `${monthLabel}月${w + 1}週`;

      cells.push(`<div class="${classes}" title="${title}">${item ? item.icon : ""}</div>`);
    }

    months.push(`
      <div class="cal-month">
        <div class="cal-label">${monthLabel}月</div>
        <div class="cal-weeks">${cells.join("")}</div>
      </div>`);
  }

  // 隠れているぶんがあることは伝える。全部見えていると誤解させない。
  const note = hidden > 0
    ? `<div class="cal-more" title="画面が狭いので、今の前後だけ表示しています">
         <span>…</span>
         <span class="cal-more-count">残り${9 - range.to}ヶ月</span>
       </div>`
    : "";

  box.innerHTML = months.join("") + note;
}

// 特殊戦術の習得状況。
// 「あと少しで届く」が見えていないと、鍛える目標にならない。
function renderTactics() {
  const box = document.getElementById("tactic-progress");

  box.innerHTML = allSpecialTactics().map(key => {
    const tactic = getTactic(key);
    const owned = state.unlocked.includes(key);

    if (owned) {
      return `
        <div class="tactic-item owned" title="${tactic.desc}">
          <div class="tactic-name">✓ ${tactic.name}<span class="tactic-got">習得済み</span></div>
        </div>`;
    }

    const unlock = tactic.unlock;
    const value = unlock.value();
    // 表示するのは「今週習得できる確率」そのもの。
    // 「習得しやすさ」のような曖昧な指標にすると、100%なのに
    // 習得できない、という食い違いが起きる。
    const chance = Math.round(tacticChance(key) * 100);
    // バーは min を 0%、full を 100% として描く
    const pct = Math.max(0, Math.min(100,
      ((value - unlock.min) / (unlock.full - unlock.min)) * 100));

    return `
      <div class="tactic-item" title="${tactic.desc}">
        <div class="tactic-name">
          ${tactic.name}
          <span class="tactic-rate ${chance === 0 ? "zero" : ""}">
            ${chance === 0 ? "条件未達" : `習得率 ${chance}% / 週`}
          </span>
        </div>
        <div class="tactic-cond" title="${unlock.desc}">
          ${unlock.label}
          <b>${value.toFixed(1)}</b> / ${unlock.full}
        </div>
        <div class="stat-track">
          <div class="stat-fill derived" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join("");
}

// 今週と来週に何があるかを文章で出す。カレンダーの色だけでは気づきにくいため。
function renderUpcoming() {
  const box = document.getElementById("upcoming");
  const now = getScheduleItem(state.week);

  // 次に控えている予定（学校行事と大会のうち、いちばん近いもの）
  const upcoming = [...SCHOOL_EVENTS, ...TOURNAMENTS.map(t => ({ ...t, type: "cup" }))]
    .filter(e => e.week > state.week)
    .sort((a, b) => a.week - b.week)[0];

  let html = "";

  if (now?.tournament) {
    const t = now.tournament;
    const enterable = canEnter(t);
    html += `
      <div class="notice notice-cup">
        <b>${t.icon} 今週は${t.name}</b>
        <div>${t.desc}</div>
        ${enterable
          ? `<div class="notice-warn">
               ${t.rounds.length}試合の連戦。疲労は試合をまたいで残る。
             </div>`
          : `<div class="notice-warn">出場権がない（県大会を勝ち抜けなかった）</div>`}
      </div>`;
  } else if (now) {
    html += `
      <div class="notice notice-${now.type}">
        <b>${now.icon} 今週は${now.name}</b>
        <div>${now.desc}</div>
        ${now.forced ? `<div class="notice-warn">練習の指示は反映されない</div>` : ""}
      </div>`;
  }

  if (state.buff) {
    const up = state.buff.mult >= 1;
    html += `
      <div class="notice ${up ? "notice-good" : "notice-bad"}">
        <b>${state.buff.text}</b>
        <div>練習効率 ${up ? "+" : ""}${Math.round((state.buff.mult - 1) * 100)}%
             （残り${state.buff.weeks}週）</div>
      </div>`;
  }

  if (upcoming && !now) {
    const weeksLeft = upcoming.week - state.week;
    const isCup = upcoming.type === "cup";
    html += `
      <div class="notice-next ${isCup ? "next-cup" : ""}">
        次の${isCup ? "大会" : "行事"}: ${upcoming.icon} ${upcoming.name}（あと${weeksLeft}週）
      </div>`;
  }

  box.innerHTML = html;
}

