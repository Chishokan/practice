#!/bin/bash
# 生成した画像を、ゲームで使える形に整える。
#
#   ./画像を取り込む.sh
#
# やること
#   1. エンディングの1枚絵を 1280px 幅にリサイズ
#   2. エンブレムの4枚組（2×2）を1校ずつに切り出す
#   3. 元データは images/original/ に残す
#
# 何度実行しても大丈夫（すでに処理済みのものは飛ばす）。

cd "$(dirname "$0")/images" || exit 1
mkdir -p original

# ---- エンディングの1枚絵 ----
# 横長なので幅1280に揃える。2MB超のままだと表示が重い。
for f in ending_champion.png ending_double.png ending_final.png ending_journey.png ending_uchiage.png; do
  [ -f "$f" ] || continue
  [ -f "original/$f" ] && continue   # 取り込み済み
  cp "$f" "original/$f"
  sips --resampleWidth 1280 "$f" --out "$f" >/dev/null 2>&1
  echo "整えました: $f"
done

# ---- エンブレムの切り出し ----
# emblems.png（2×2に4校）を1校ずつに割る。
# 並び順は画像プロンプト.md のとおり:
#   左上=城東  右上=北嶺
#   左下=明星  右下=帝王
if [ -f emblems.png ] && [ ! -f original/emblems.png ]; then
  cp emblems.png original/emblems.png

  size=$(sips -g pixelWidth emblems.png | awk '/pixelWidth/{print $2}')
  half=$((size / 2))

  crop() { # crop 出力名 Y X
    sips -c "$half" "$half" --cropOffset "$2" "$3" emblems.png --out "$1" >/dev/null 2>&1
    sips --resampleWidth 256 "$1" --out "$1" >/dev/null 2>&1
    echo "切り出しました: $1"
  }

  crop emblem_jouto.png    0      0
  crop emblem_hokurei.png  0      "$half"
  crop emblem_myojo.png    "$half" 0
  crop emblem_teiou.png    "$half" "$half"

  rm emblems.png
fi

echo ""
echo "いま入っている画像:"
ls -la *.png | awk '{printf "  %-26s %5.0f KB\n", $9, $5/1024}'
