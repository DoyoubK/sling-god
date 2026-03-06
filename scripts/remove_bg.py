#!/usr/bin/env python3
"""
remove_bg.py — 흰 배경 / 단색 배경 제거 유틸

사용법:
  # 단일 파일 (출력 파일명 지정)
  python3 scripts/remove_bg.py public/assets/tree_oak.png public/assets/tree_oak.png

  # 단일 파일 (자동 _nobg 접미사)
  python3 scripts/remove_bg.py -i public/assets/tree_oak.png

  # 일괄 처리 (assets 폴더 전체, 원본 덮어쓰기)
  python3 scripts/remove_bg.py --dir public/assets/ --inplace

  # 특정 색상 배경 제거
  python3 scripts/remove_bg.py -i public/assets/bg.png --color 200,220,255 --tolerance 40
"""
import argparse
import sys
from pathlib import Path
from PIL import Image
import numpy as np


def remove_background(
    img: Image.Image,
    bg_color: tuple = (255, 255, 255),
    tolerance: int = 25,
    edge_feather: bool = True,
) -> Image.Image:
    """지정 색상을 투명으로 변환. edge_feather=True 이면 경계 부드럽게 처리."""
    img = img.convert("RGBA")
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    br, bg_, bb = bg_color

    dist = np.sqrt((r - br)**2 + (g - bg_)**2 + (b - bb)**2)

    alpha = a.copy()
    if edge_feather:
        hard_thr  = tolerance * 0.6
        soft_thr  = tolerance
        alpha[dist < hard_thr] = 0
        edge_mask = (dist >= hard_thr) & (dist < soft_thr)
        alpha[edge_mask] = np.clip(
            ((dist[edge_mask] - hard_thr) / (soft_thr - hard_thr)) * 255, 0, 255
        )
    else:
        alpha[dist < tolerance] = 0

    data[:,:,3] = alpha
    return Image.fromarray(data.astype(np.uint8))


def process_file(src: Path, dst: Path, bg_color, tolerance, feather):
    try:
        img = Image.open(src)
    except Exception as e:
        print(f"❌ 열기 실패: {src} — {e}")
        return False
    result = remove_background(img, bg_color=bg_color, tolerance=tolerance, edge_feather=feather)
    dst.parent.mkdir(parents=True, exist_ok=True)
    result.save(dst, "PNG")
    print(f"✅ {src.name} → {dst.name}")
    return True


def parse_color(s):
    try:
        parts = tuple(int(x.strip()) for x in s.split(","))
        assert len(parts) == 3
        return parts
    except Exception:
        raise argparse.ArgumentTypeError("색상 형식: R,G,B  예) 255,255,255")


def main():
    parser = argparse.ArgumentParser(description="흰 배경 / 단색 배경 제거 유틸")
    parser.add_argument("-i", "--input",  help="입력 PNG 파일")
    parser.add_argument("-o", "--output", help="출력 PNG 파일 (미지정 시 _nobg 접미사)")
    parser.add_argument("--dir",    help="일괄 처리할 폴더 경로")
    parser.add_argument("--inplace", action="store_true", help="원본 파일 덮어쓰기")
    parser.add_argument("--color",   default="255,255,255", type=parse_color,
                        help="제거할 배경 색상 R,G,B (기본: 255,255,255)")
    parser.add_argument("--tolerance", type=int, default=25,
                        help="색상 허용 오차 0~255 (기본: 25)")
    parser.add_argument("--no-feather", action="store_true",
                        help="경계 페더링 비활성화 (하드 엣지)")
    args = parser.parse_args()

    feather = not args.no_feather
    bg      = args.color

    if args.dir:
        folder = Path(args.dir)
        pngs = list(folder.glob("*.png"))
        if not pngs:
            print(f"❌ PNG 파일 없음: {folder}")
            sys.exit(1)
        print(f"📂 {len(pngs)}개 파일 처리 중...")
        for src in pngs:
            dst = src if args.inplace else src.with_stem(src.stem + "_nobg")
            process_file(src, dst, bg, args.tolerance, feather)
    elif args.input:
        src = Path(args.input)
        dst = Path(args.output) if args.output else src.with_stem(src.stem + "_nobg")
        process_file(src, dst, bg, args.tolerance, feather)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
