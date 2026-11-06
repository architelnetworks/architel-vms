"""Check real mock camera capture, recording, motion and recorded-video decode."""

import asyncio
import json
import time
from pathlib import Path
from urllib.request import urlopen

API = "http://127.0.0.1:5000"
CAMERAS = ("main_entrance", "corridor", "car_park")
FFMPEG = "/usr/lib/ffmpeg/8.0/bin/ffmpeg"


def get(path: str, binary: bool = False):
    """Fetch local API data, keeping blocking HTTP off the async event loop."""
    with urlopen(API + path, timeout=30) as response:
        data = response.read()
    return data if binary else json.loads(data)


async def check_camera(camera: str, stats: dict, events: list) -> dict:
    """Decode actual recorded media and summarize observed camera activity."""
    metric = stats["cameras"][camera]
    if metric["camera_fps"] <= 0 or metric["process_fps"] <= 0:
        raise RuntimeError(f"{camera}: capture/processing is not running")
    snapshot, recordings = await asyncio.gather(
        asyncio.to_thread(get, f"/api/{camera}/latest.jpg", True),
        asyncio.to_thread(get, f"/api/{camera}/recordings"),
    )
    if not snapshot.startswith(b"\xff\xd8"):
        raise RuntimeError(f"{camera}: expected a JPEG snapshot")
    if not recordings:
        raise RuntimeError(f"{camera}: no finalized recording segments yet")
    first = recordings[0]
    start = int(first["start_time"])
    end = int(first["end_time"]) + 1
    playlist = f"/vod/{camera}/start/{start}/end/{end}/index.m3u8"
    process = await asyncio.create_subprocess_exec(
        FFMPEG, "-nostdin", "-v", "error", "-i", API + playlist,
        "-t", "2", "-f", "null", "-",
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    try:
        _, error = await asyncio.wait_for(process.communicate(), timeout=45)
    except TimeoutError:
        process.kill()
        await process.wait()
        raise RuntimeError(f"{camera}: recorded playback timed out") from None
    if process.returncode:
        raise RuntimeError(f"{camera}: recorded playback failed: {error.decode()}")
    labels = sorted({e["label"] for e in events if e["camera"] == camera})
    return {
        "camera_fps": metric["camera_fps"],
        "process_fps": metric["process_fps"],
        "detection_fps": metric["detection_fps"],
        "snapshot_bytes": len(snapshot),
        "recording_segments": len(recordings),
        "motion_segments": sum(r.get("motion", 0) > 0 for r in recordings),
        "object_segments": sum(r.get("objects", 0) > 0 for r in recordings),
        "observed_event_labels": labels,
        "decoded_recorded_playlist": playlist,
    }


async def main() -> None:
    """Verify the isolated stack after it has recorded at least 30 seconds."""
    stats, events, config = await asyncio.gather(
        asyncio.to_thread(get, "/api/stats"),
        asyncio.to_thread(get, "/api/events?limit=1000"),
        asyncio.to_thread(get, "/api/config"),
    )
    if set(config["cameras"]) != set(CAMERAS):
        raise RuntimeError("Expected exactly the three isolated mock cameras")
    results = await asyncio.gather(
        *(check_camera(camera, stats, events) for camera in CAMERAS)
    )
    report = {
        "verified_at": time.time(),
        "cameras": dict(zip(CAMERAS, results)),
        "scope": "Real capture, snapshots, recording API and recorded HLS decode",
        "not_established_by_this_script": [
            "browser live-video rendering", "loop-boundary continuity",
            "restart recovery", "detection accuracy or counting accuracy",
        ],
    }
    output = Path("/media/frigate/mock-verification.json")
    output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
