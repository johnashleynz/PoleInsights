import json,subprocess,sys,math
from pathlib import Path
sys.path.insert(0,str(Path('.media-deps').resolve()))
import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe();root=Path('public/videos');work=Path('.media-work');films=json.loads((root/'manifest.json').read_text())
def run(args):
 p=subprocess.run([ff,'-hide_banner','-loglevel','error','-y',*args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
def stamp(v):
 ms=round(v*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
def ass_stamp(value):
 ticks=round(value*100);return f'{ticks//360000}:{ticks//6000%60:02}:{ticks//100%60:02}.{ticks%100:02}'
def chapter_captions(ch,path):
 header="""[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Segoe UI,23,&H004D3818,&H004D3818,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,32,32,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
 lines=[]
 for j,cue in enumerate(ch['cues']):
  end=min(ch['duration'],cue['end']+.12,ch['cues'][j+1]['start'] if j+1<len(ch['cues']) else ch['duration'])
  text=cue['text'].replace('{','').replace('}','').replace('\\','')
  lines.append(f"Dialogue: 0,{ass_stamp(cue['start'])},{ass_stamp(end)},Default,,0,0,0,,"+r"{\pos(640,676)}"+text)
 path.write_text(header+'\n'.join(lines),encoding='utf-8')
for film in films:
 parts=[];offset=0;vtt=['WEBVTT',''];chapter_marks=[]
 for i,ch in enumerate(film['chapters']):
  stem=f"{film['id']}-{i}";raw=work/(stem+'.webm');out=work/(stem+'.mp4');duration=math.ceil(ch['duration']*30)/30
  if not raw.exists():raise RuntimeError(f'Missing {raw}')
  captions=work/(stem+'.ass');chapter_captions(ch,captions)
  run(['-i',str(raw),'-i',str(root/ch['audio']),'-map','0:v:0','-map','1:a:0','-vf',f'fps=30,tpad=stop_mode=clone:stop_duration=1,drawbox=x=0:y=634:w=1280:h=86:color=0xeef4f8:t=fill,ass={captions.as_posix()}','-af',f"adelay={round(ch.get('audioDelay',0)*1000)}:all=1,loudnorm=I=-16:TP=-1.5:LRA=11,apad",'-t',str(duration),'-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','128k','-movflags','+faststart',str(out)])
  parts.append(out);chapter_marks.append({'title':ch['title'],'start':offset,'duration':duration})
  for j,cue in enumerate(ch['cues']):
   end=min(duration,cue['end']+.12,ch['cues'][j+1]['start'] if j+1<len(ch['cues']) else duration)
   vtt += [f"{stamp(offset+cue['start'])} --> {stamp(offset+end)}",cue['text'],'']
  offset+=duration;ch['duration']=duration
  print('Encoded',stem,flush=True)
 listing=work/(film['id']+'.concat.txt');listing.write_text('\n'.join("file '"+p.name+"'" for p in parts),encoding='utf-8')
 run(['-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(root/(film['id']+'.mp4'))])
 run(['-ss','4','-i',str(root/(film['id']+'.mp4')),'-frames:v','1','-q:v','2',str(root/(film['id']+'.jpg'))])
 (root/(film['id']+'.vtt')).write_text('\n'.join(vtt),encoding='utf-8');film['duration']=offset;film['chapterMarks']=chapter_marks;film['captions']='Burned-in English, plus optional WebVTT';film['resolution']='1280 x 720 / 30 fps'
 print('Finished',film['id'],round(offset,2),'seconds',flush=True)
(root/'manifest.json').write_text(json.dumps(films,indent=2),encoding='utf-8')
