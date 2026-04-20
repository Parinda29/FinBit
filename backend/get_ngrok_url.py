import argparse
import json
import re
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


def fetch_ngrok_https_url(api_url: str, retries: int, delay_seconds: float) -> str:
    last_error = None
    for _ in range(max(retries, 1)):
        try:
            with urlopen(api_url, timeout=2) as response:
                payload = json.loads(response.read().decode("utf-8"))

            tunnels = payload.get("tunnels", [])
            https_tunnel = next(
                (item for item in tunnels if item.get("proto") == "https" and item.get("public_url")),
                None,
            )
            if https_tunnel:
                return https_tunnel["public_url"].rstrip("/")
            last_error = "No https tunnel found in ngrok API response."
        except (URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            last_error = str(exc)

        time.sleep(max(delay_seconds, 0.1))

    raise RuntimeError(last_error or "Failed to read ngrok URL.")


def upsert_env_value(file_path: Path, key: str, value: str) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    if file_path.exists():
        lines = file_path.read_text(encoding="utf-8-sig").splitlines()
    else:
        lines = []

    pattern = re.compile(rf"^{re.escape(key)}=")
    replaced = False
    new_lines = []

    for line in lines:
        clean_line = line.lstrip("\ufeff")
        if pattern.match(clean_line):
            if not replaced:
                new_lines.append(f"{key}={value}")
                replaced = True
            continue
        new_lines.append(clean_line)

    if not replaced:
        new_lines.append(f"{key}={value}")

    file_path.write_text("\n".join(new_lines).strip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch ngrok public URL and sync env files.")
    parser.add_argument("--api-url", default="http://127.0.0.1:4040/api/tunnels")
    parser.add_argument("--retries", type=int, default=20)
    parser.add_argument("--delay", type=float, default=0.25)
    parser.add_argument("--backend-env", default="backend/.env")
    parser.add_argument("--frontend-env", default="frontend/.env.local")
    parser.add_argument("--print-only", action="store_true")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    backend_env_path = (repo_root / args.backend_env).resolve()
    frontend_env_path = (repo_root / args.frontend_env).resolve()

    try:
        ngrok_url = fetch_ngrok_https_url(args.api_url, args.retries, args.delay)
    except Exception as exc:
        print(f"Failed to fetch ngrok URL: {exc}", file=sys.stderr)
        return 1

    if args.print_only:
        print(ngrok_url)
        return 0

    ngrok_host = ngrok_url.split("//", 1)[-1]
    local_cors = (
        "http://localhost:19000,http://localhost:19001,http://localhost:8081,"
        "http://127.0.0.1:19000,http://127.0.0.1:8081,http://10.0.2.2:19000,http://10.0.2.2:8081"
    )
    cors_origins = f"{local_cors},{ngrok_url}"

    upsert_env_value(backend_env_path, "DJANGO_DEBUG", "True")
    upsert_env_value(backend_env_path, "DJANGO_ALLOWED_HOSTS", f"127.0.0.1,localhost,{ngrok_host}")
    upsert_env_value(backend_env_path, "NGROK_URL", ngrok_url)
    upsert_env_value(backend_env_path, "CORS_ALLOW_ALL_ORIGINS", "False")
    upsert_env_value(backend_env_path, "CORS_ALLOWED_ORIGINS", cors_origins)
    upsert_env_value(backend_env_path, "CSRF_TRUSTED_ORIGINS", ngrok_url)

    upsert_env_value(frontend_env_path, "EXPO_PUBLIC_API_HOST", ngrok_url)

    print(f"Using backend: {ngrok_url}")
    print(f"Updated: {backend_env_path}")
    print(f"Updated: {frontend_env_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
