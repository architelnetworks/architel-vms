"""Download attributed mock footage and prepare deterministic looping inputs."""

import asyncio
import hashlib
import json
import os
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
DATA = Path("/data")
FFMPEG = "/usr/lib/ffmpeg/8.0/bin/ffmpeg"
FFPROBE = "/usr/lib/ffmpeg/8.0/bin/ffprobe"
ENCODING_VERSION = 1


def sha256(path: Path) -> str:
    """Compute a file digest without loading video into memory."""
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


async def run(*args: str) -> str:
    """Run a checked CLI operation and return its standard output."""
    process = await asyncio.create_subprocess_exec(
        *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    if process.returncode:
        raise RuntimeError(f"{args[0]} failed: {stderr.decode()[-4000:]}")
    return stdout.decode()


async def prepare_clip(clip: dict) -> None:
    """Verify a source download and encode its selected excerpt once."""
    name = clip["camera"]
    source = DATA / "source" / Path(clip["url"]).name
    output = DATA / "footage" / f"{name}.mp4"
    receipt_path = output.with_suffix(".json")
    recipe = {"clip": clip, "encoding_version": ENCODING_VERSION}

    if output.exists() and receipt_path.exists():
        receipt = json.loads(receipt_path.read_text())
        if receipt.get("recipe") == recipe and receipt.get("sha256") == sha256(output):
            print(f"{name}: verified prepared clip", flush=True)
            return

    if not source.exists():
        print(f"{name}: downloading licensed MEVA source", flush=True)
        temporary = source.with_suffix(".download")
        await run(
            "curl", "--fail", "--location", "--silent", "--show-error",
            "--retry", "3", "--connect-timeout", "15", "--max-time", "600",
            "--output", str(temporary), clip["url"],
        )
        if sha256(temporary) != clip["sha256"]:
            temporary.unlink()
            raise RuntimeError(f"{name}: source checksum mismatch")
        os.replace(temporary, source)
    elif sha256(source) != clip["sha256"]:
        raise RuntimeError(f"{name}: cached source checksum mismatch: {source}")

    print(f"{name}: preparing {clip['duration_seconds']} second excerpt", flush=True)
    temporary = output.with_suffix(".partial.mp4")
    await run(
        FFMPEG, "-hide_banner", "-loglevel", "error", "-y",
        "-ss", str(clip["start_seconds"]), "-i", str(source),
        "-t", str(clip["duration_seconds"]), "-map", "0:v:0", "-an",
        "-vf", "setpts=PTS-STARTPTS,fps=15,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-threads", "2", "-profile:v", "baseline", "-pix_fmt", "yuv420p",
        "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-bf", "0",
        "-movflags", "+faststart", str(temporary),
    )
    probe = json.loads(await run(
        FFPROBE, "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(temporary),
    ))
    stream = probe["streams"][0]
    if (
        stream["codec_name"] != "h264"
        or (stream["width"], stream["height"]) != (1920, 1080)
        or abs(float(probe["format"]["duration"]) - clip["duration_seconds"]) > 1
    ):
        raise RuntimeError(f"{name}: unexpected prepared clip format/duration")
    os.replace(temporary, output)
    receipt_path.write_text(json.dumps({
        "recipe": recipe,
        "sha256": sha256(output),
        "probe": probe,
    }, indent=2) + "\n")
    print(f"{name}: ready ({output.stat().st_size // 1024 // 1024} MiB)", flush=True)


async def main() -> None:
    """Prepare all three clips using only the existing dependency image."""
    for directory in (DATA / "source", DATA / "footage"):
        directory.mkdir(parents=True, exist_ok=True)
    sources = json.loads((TOOLS / "sources.json").read_text())
    await asyncio.gather(*(prepare_clip(clip) for clip in sources["clips"]))
    # Keep attribution beside local media, including when that directory is copied.
    (DATA / "footage" / "ATTRIBUTION.md").write_text(
        (TOOLS / "ATTRIBUTION.md").read_text()
    )


if __name__ == "__main__":
    asyncio.run(main())
