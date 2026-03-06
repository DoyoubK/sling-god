# scripts/

## remove_bg.py — 배경 제거 유틸

PNG 에셋의 흰색(또는 단색) 배경을 투명으로 변환.
나노바나나로 생성한 에셋 적용 전 반드시 실행.

### 설치
```bash
pip3 install Pillow numpy
```

### 사용법

```bash
# 단일 파일
python3 scripts/remove_bg.py -i public/assets/tree_oak.png -o public/assets/tree_oak.png

# 자동 _nobg 접미사 (원본 보존)
python3 scripts/remove_bg.py -i public/assets/tree_oak.png

# 폴더 전체 일괄 처리 (원본 덮어쓰기)
python3 scripts/remove_bg.py --dir public/assets/ --inplace

# 특정 색상 배경 제거 (허용 오차 조절)
python3 scripts/remove_bg.py -i input.png -o output.png --color 200,220,255 --tolerance 40

# 하드 엣지 (페더링 없음)
python3 scripts/remove_bg.py -i input.png --no-feather
```

### 옵션
| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `--color` | 255,255,255 | 제거할 배경색 (R,G,B) |
| `--tolerance` | 25 | 색상 허용 오차 (높을수록 더 많이 제거) |
| `--inplace` | false | 원본 덮어쓰기 |
| `--no-feather` | false | 경계 페더링 비활성화 |

### 에셋 적용 워크플로우
```bash
# 1. 나노바나나로 에셋 생성 → public/assets/ 에 저장
# 2. 배경 제거
python3 scripts/remove_bg.py --dir public/assets/ --inplace --tolerance 30
# 3. 게임 실행 → 자동 연동
npm run dev
```
