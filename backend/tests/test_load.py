"""Backend 載入測試。確保 SECRET_KEY 強制要求在子 process 仍生效。"""

import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent


def test_app_loads_with_secret_key():
    """SECRET_KEY 已設時，app 載入成功。"""
    from app.main import app

    assert app.title == "碳排放 SaaS API"


def test_app_refuses_to_load_without_secret_key():
    """SECRET_KEY 與 .env 都不存在時，必須 raise RuntimeError。
    用子 process 避免污染目前測試環境的 SECRET_KEY 與 module cache。"""

    script = (
        "import os, shutil, sys\n"
        "os.environ.pop('SECRET_KEY', None)\n"
        # 暫時搬走可能被 dotenv 抓到的兩個 .env
        "moved = []\n"
        "for p in ['.env', '../.env']:\n"
        "    try:\n"
        "        shutil.move(p, p + '.testbak')\n"
        "        moved.append(p)\n"
        "    except FileNotFoundError:\n"
        "        pass\n"
        "try:\n"
        "    try:\n"
        "        from app.auth_utils import SECRET_KEY  # noqa: F401\n"
        "    except RuntimeError as e:\n"
        "        print('RAISED:' + str(e)[:40])\n"
        "        sys.exit(0)\n"
        "    sys.exit(2)\n"
        "finally:\n"
        "    for p in moved:\n"
        "        shutil.move(p + '.testbak', p)\n"
    )

    env = {k: v for k, v in __import__("os").environ.items() if k != "SECRET_KEY"}
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=str(BACKEND_DIR),
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, f"stderr={result.stderr}\nstdout={result.stdout}"
    assert "RAISED:" in result.stdout
    assert "SECRET_KEY" in result.stdout
