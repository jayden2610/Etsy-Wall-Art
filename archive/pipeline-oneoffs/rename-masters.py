"""
Rename the remaining Grok source masters to drop the misleading "2x3" token.

Before:  J01_sakura__v1__4x5.jpg
After:   J01_sakura__v1__3x2.jpg   (the actual master ratio, 3:2 horizontal)

Before:  J01_sakura__v1__2x3.jpg    (already deleted by drop-2x3-and-regen.py)
After:   (gone)
"""
import os
import glob

SRC = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\Grok Images"


def main():
    count = 0
    for f in sorted(glob.glob(os.path.join(SRC, "*__v1__*.*"))):
        name = os.path.basename(f)
        new_name = name.replace("__v1__", "__v1__3x2__")
        # Avoid double-rename if already done
        new_name = new_name.replace("__v1__3x2__3x2__", "__v1__3x2__")
        new_path = os.path.join(SRC, new_name)
        if new_path == f:
            continue
        os.rename(f, new_path)
        print(f"  {name}  ->  {new_name}")
        count += 1
    print(f"\nRenamed {count} files.")


if __name__ == "__main__":
    main()
