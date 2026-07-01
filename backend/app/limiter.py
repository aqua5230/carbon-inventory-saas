"""Rate limit 設定（slowapi）。

- 預設用 client IP 作 key。
- `LOGIN_RATE_LIMIT` 環境變數可調整 login 上限字串（slowapi 格式，例 "5/minute"）。
- pytest / 開發環境想關閉時設 `RATE_LIMIT_ENABLED=false`。
- production 用 in-process memory backend 對單機足夠；多 instance 部署需要換 Redis backend。
"""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address


LOGIN_RATE_LIMIT = os.getenv("LOGIN_RATE_LIMIT", "5/minute")

limiter = Limiter(
    key_func=get_remote_address,
    enabled=os.getenv("RATE_LIMIT_ENABLED", "true").lower() != "false",
    headers_enabled=True,
)
