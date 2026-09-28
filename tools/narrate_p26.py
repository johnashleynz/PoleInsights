"""One Ryan call per chapter; word-gap pauses, shifted events and cue-derived direction."""
import asyncio,json,sys,subprocess,re,hashlib,math,wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.media-deps'))
import edge_tts,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/videos/p26-audio';OUT.mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe(); SR=44100
def parse(marked):
 text='';marks=[]
 for part in re.split(r'(\[P[\d.]+\]|\{(?:CAM|LABEL):[^}]+\})',marked):
  if part.startswith('[P'):marks.append({'kind':'pause','value':float(part[2:-1]),'char':len(text)})
  elif part.startswith('{'):k,v=part[1:-1].split(':',1);marks.append({'kind':k,'value':v,'char':len(text)})
  else:text+=part
 return text,marks
def align(text,words):
 pos=[i for i,c in enumerate(text) if c.isalnum()];compact=''.join(text[i].lower() for i in pos);cursor=0
 for w in words:
  token=''.join(c.lower() for c in w['text'] if c.isalnum());a=compact.find(token,cursor)
  if not token or a<0:raise ValueError('Alignment failed: '+w['text'])
  b=a+len(token);w['originalStart']=pos[a];w['originalEnd']=pos[b-1]+1;cursor=b
  while w['originalEnd']<len(text) and text[w['originalEnd']] in '.,!?;:':w['originalEnd']+=1
  w['caption']=text[w['originalStart']:w['originalEnd']]
 return words
def wav(path,data):
 with wave.open(str(path),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes(data.astype('<i2').tobytes())
async def main():
 films=json.loads((ROOT/'scripts/storyboard.json').read_text(encoding='utf-8'))
 for fi,film in enumerate(films):
  for ci,ch in enumerate(film['chapters']):
   text,marks=parse(ch['text']);ch['markedText']=ch['text'];ch['text']=text
   stem=f"{film['id']}-{ci}-p26";mp3=OUT/(stem+'.mp3');meta=OUT/(stem+'.raw.timing.jsonl');key=OUT/(stem+'.voice.json')
   spec={'provider':'edge_tts','voice':'en-GB-RyanNeural','rate':'-8%','volume':'+0%','pitch':'+0Hz','text':text,'unit':'one chapter per call'}
   fingerprint=hashlib.sha256(json.dumps(spec,sort_keys=True).encode()).hexdigest()
   if not (mp3.exists() and key.exists() and meta.exists() and json.loads(key.read_text()).get('fingerprint')==fingerprint):
    for attempt in range(3):
     try:await edge_tts.Communicate(text,voice=spec['voice'],rate=spec['rate'],boundary='WordBoundary').save(str(mp3),str(meta));break
     except Exception:
      if attempt==2:raise
      await asyncio.sleep(2)
    key.write_text(json.dumps({**spec,'fingerprint':fingerprint},indent=2),encoding='utf-8')
   words=align(text,[json.loads(l) for l in meta.read_text(encoding='utf-8').splitlines() if l.strip()])
   pcm=np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(mp3),'-f','s16le','-ac','1','-ar',str(SR),'-']),dtype='<i2').copy()
   cuts=[]
   for m in marks:
    wi=next((i for i,w in enumerate(words) if w['originalEnd']>m['char']),len(words)-1);m['wordIndex']=wi
    if m['kind']=='pause':
     before=(words[wi-1]['offset']+words[wi-1]['duration'])/1e7 if wi else 0;after=words[wi]['offset']/1e7
     if before>after+.015:raise ValueError('Overlapping word boundaries')
     m['rawCut']=(before+after)/2;cuts.append(m)
   lead=.8 if ci==0 else film['chapters'][ci-1]['gapAfter']/2;tail=ch['gapAfter']/2
   pieces=[np.zeros(round(lead*SR),dtype='<i2')];cursor=0
   for m in sorted(cuts,key=lambda q:q['rawCut']):
    ix=round(m['rawCut']*SR);pieces.extend([pcm[cursor:ix],np.zeros(round(m['value']*SR),dtype='<i2')]);cursor=ix
   pieces.extend([pcm[cursor:],np.zeros(round(tail*SR),dtype='<i2')]);audio=np.concatenate(pieces)
   duration=math.ceil(len(audio)/SR*30)/30;audio=np.pad(audio,(0,round(duration*SR)-len(audio)))
   for w in words:
    raw=w['offset']/1e7;w['rawOffset']=w['offset'];w['offset']=round((raw+lead+sum(m['value'] for m in cuts if m['rawCut']<=raw))*1e7)
   for m in marks:
    w=words[m['wordIndex']];m['time']=w['offset']/1e7;m['word']=w['caption']
   ch['duration']=duration;ch['audio']='p26-audio/'+stem+'.wav';ch['audioDelay']=0;ch['lead']=lead;ch['tail']=tail;ch['wordCount']=len(words);ch['wpm']=round(len(words)/duration*60,1);ch['cueMarks']=marks
   ch['labels']=[]
   for m in marks:
    if m['kind']!='LABEL':continue
    sentence=next((w for w in words[m['wordIndex']:] if re.search('[.!?]$',w['caption'])),words[-1]);start=max(0,m['time']-.3);end=max(start+3,m['time']+2.5,(sentence['offset']+sentence['duration'])/1e7)
    ch['labels'].append({'text':m['value'],'start':start,'end':min(duration,end+.4),'side':'left','y':178,'cueTime':m['time'],'word':m['word']})
   cams=[m for m in marks if m['kind']=='CAM'];shots=[]
   for n,m in enumerate(cams):
    cfg=ch['shots'][n];movement=0 if n==0 or cfg['transition']=='cut' else (1.6 if m['value'] in ['detail','tip'] else .9)
    end=max(0,m['time']-.3);start=max(0,end-movement)
    shots.append({**cfg,'cueTime':m['time'],'cueWord':m['word'],'start':start if n else 0,'arrive':end if n else 0,'moveDuration':movement,'easing':cfg['easing']})
   ch['shots']=shots;ch['staticPercent']=round(100*(1-sum(s['arrive']-s['start'] for s in shots if s['moveDuration'])/duration),1)
   cues=[];group=[]
   for w in words:
    group.append(w)
    if len(' '.join(x['caption'] for x in group))>66 or re.search('[.!?]$',w['caption']) or w is words[-1]:
     cues.append({'start':group[0]['offset']/1e7,'end':(w['offset']+w['duration'])/1e7,'text':text[group[0]['originalStart']:w['originalEnd']].strip()});group=[]
   ch['cues']=cues
   wav(OUT/(stem+'.wav'),audio);(OUT/(stem+'.timing.jsonl')).write_text('\n'.join(json.dumps(w) for w in words),encoding='utf-8')
   print(stem,round(duration,2),'seconds',ch['wpm'],'wpm',flush=True)
  film['duration']=sum(c['duration'] for c in film['chapters']);film['voice']='en-GB-RyanNeural';film['captions']='English';film['revision']='P26'
  (ROOT/'public/videos/manifest-p26.json').write_text(json.dumps(films,indent=2),encoding='utf-8')
 (ROOT/'public/videos/manifest.json').write_text(json.dumps(films,indent=2),encoding='utf-8')
 print('All seven film voices ready',flush=True)
asyncio.run(main())
