"""
Drop the 2x3 ratio from the Japandi and Botanical bundles.

The Grok source masters are actually 3:2 horizontal, so the 2:3 portrait crop
mutilates every off-center subject. The four portrait ratios (4:5, 5:7, 11x14,
ISO) crop the same masters much less aggressively, so the artwork reads as
designed in every one of them. 4:5 is also the most popular physical frame
size on Etsy (8x10 / 16x20), so dropping 2x3 is a net upgrade, not a loss.

This script:
  1. Removes every 2x3 folder and every *_2x3* file from output/japandi and
     output/botanical (including the per-print subfolders and the grid PNGs).
  2. Removes the matching 2x3 source files from output/Grok Images so the
     next re-aspect run won't recreate them.
  3. Leaves the 4:5, 5:7, 11x14, ISO folders and files untouched.
"""
import os
import shutil
import glob

JAPANDI = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\japandi"
BOTANICAL = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\botanical"
SRC = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\Grok Images"


def drop_2x3(root):
    removed = 0
    # 1. All <bundle>_<ratio>__grid.png files
    for f in glob.glob(os.path.join(root, "*_2x3__grid.png")):
        os.remove(f)
        print("  rm", os.path.relpath(f, root))
        removed += 1
    # 2. All <ID>/2x3/ subfolders
    for pid_dir in glob.glob(os.path.join(root, "[JB][0-9][0-9]", "2x3")):
        shutil.rmtree(pid_dir)
        print("  rm", os.path.relpath(pid_dir, root))
        removed += 1
    # 3. Any leftover <ID>__2x3.* files at the bundle root
    for f in glob.glob(os.path.join(root, "*__2x3.*")):
        os.remove(f)
        print("  rm", os.path.relpath(f, root))
        removed += 1
    return removed


def drop_src_2x3():
    removed = 0
    for f in glob.glob(os.path.join(SRC, "*_v1__2x3.*")):
        os.remove(f)
        print("  rm", os.path.relpath(f, SRC))
        removed += 1
    return removed


print("Japandi:")
n1 = drop_2x3(JAPANDI)
print("Botanical:")
n2 = drop_2x3(BOTANICAL)
print("Source masters:")
n3 = drop_src_2x3()
print(f"\nRemoved {n1 + n2 + n3} files/folders.")
