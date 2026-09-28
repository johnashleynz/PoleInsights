"""Generate an original, non-sensitive narration sample using an available neural voice."""
import asyncio, sys
from pathlib import Path
sys.path.insert(0, str(Path('.media-deps').resolve()))
import edge_tts
async def main():
    voices=await edge_tts.list_voices()
    candidates=[v for v in voices if v['ShortName'].startswith('en-GB')]
    print([{'name':v['ShortName'],'tag':v.get('VoiceTag')} for v in candidates],flush=True)
    voice='en-GB-RyanNeural'
    chosen=next(v for v in voices if v['ShortName']==voice)
    print(chosen['ShortName'],chosen.get('VoiceTag'),flush=True)
    text="Where would you expect this pole to break? Near the ground, perhaps. But let's look a little closer. A thicker section can carry more bending. Hidden decay changes the picture, and turning the load can change it again."
    out=Path('public/videos/voice-preview-p18.mp3')
    await edge_tts.Communicate(text,voice=voice,rate='+0%').save(str(out))
    print(out,flush=True)
asyncio.run(main())
