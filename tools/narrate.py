"""Render original scripts; fingerprints prevent stale narration reuse."""
import asyncio,json,sys,subprocess,re,hashlib,math
from pathlib import Path
sys.path.insert(0,str(Path('.media-deps').resolve()))
import edge_tts,imageio_ffmpeg
root=Path('public/videos');films=json.loads((root/'storyboard.json').read_text(encoding='utf-8-sig'));ff=imageio_ffmpeg.get_ffmpeg_exe()
VOICE='en-GB-RyanNeural';RATE='+0%';REVISION='P19';LEAD=.3;TAIL=.45
def align_words(text,words):
 # Speech word events omit punctuation. Recover exact original-script spans for captions.
 positions=[i for i,ch in enumerate(text) if ch.isalnum()]
 compact=''.join(text[i].lower() for i in positions);cursor=0
 for w in words:
  token=''.join(ch.lower() for ch in w['text'] if ch.isalnum())
  start=compact.find(token,cursor)
  if not token or start<0:raise ValueError('Cannot align caption word: '+w['text'])
  end=start+len(token);a=positions[start];b=positions[end-1]+1
  while b<len(text) and text[b] in '.,!?;:':b+=1
  w['originalStart']=a;w['originalEnd']=b;w['caption']=text[a:b];cursor=end
 return words
async def main():
 for film in films:
  for i,ch in enumerate(film['chapters']):
   stem=f"{film['id']}-{i}-{film.get('audioRevision','p18')}";mp3=root/(stem+'.mp3');meta=root/(stem+'.timing.jsonl');key=root/(stem+'.voice.json')
   spec={'voice':VOICE,'rate':RATE,'text':ch['text']};fingerprint=hashlib.sha256(json.dumps(spec,sort_keys=True).encode()).hexdigest()
   if not (mp3.exists() and meta.exists() and key.exists() and json.loads(key.read_text()).get('fingerprint')==fingerprint):
    await edge_tts.Communicate(ch['text'],voice=VOICE,rate=RATE,boundary='WordBoundary').save(str(mp3),str(meta))
    key.write_text(json.dumps({**spec,'fingerprint':fingerprint},indent=2))
   info=subprocess.run([ff,'-i',str(mp3)],capture_output=True,text=True).stderr
   m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',info)
   if not m:raise RuntimeError(info)
   seconds=int(m[1])*3600+int(m[2])*60+float(m[3]);ch['duration']=math.ceil((seconds+LEAD+TAIL)*30)/30;ch['audio']=stem+'.mp3';ch['audioDelay']=LEAD
   words=align_words(ch['text'],[json.loads(line) for line in meta.read_text(encoding='utf-8').splitlines() if line.strip()]);cues=[];group=[]
   for w in words:
    group.append(w)
    if len(' '.join(x['text'] for x in group))>=72 or (len(group)>=5 and re.search(r'[.!?;:]$',w['caption'])) or w is words[-1]:
     cues.append({'start':LEAD+group[0]['offset']/1e7,'end':LEAD+(group[-1]['offset']+group[-1]['duration'])/1e7,'text':ch['text'][group[0]['originalStart']:group[-1]['originalEnd']]});group=[]
   ch['cues']=cues
   print(stem,round(ch['duration'],2),flush=True)
  film['duration']=sum(c['duration'] for c in film['chapters']);film['voice']=VOICE;film['captions']='English';film['revision']=REVISION
 (root/'manifest.json').write_text(json.dumps(films,indent=2),encoding='utf-8')
 print('UK narration ready',flush=True)
asyncio.run(main())
