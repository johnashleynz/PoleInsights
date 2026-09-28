import {defaultCase,newRegion} from '../domain/model.ts';
export function filmCase(film:number,chapter:number){const p=defaultCase('A');p.regions=[];p.soil='Fixed';p.loadKN=3;p.bearing=90;const r=newRegion(p);r.zMin=.2;r.zMax=1.8;r.severity=.8;r.shape={type:'ellipse',centreX:0,centreY:0,radiusX:.09,radiusY:.075,angle:0,profile:'constant'};r.decay={pattern:'heart',progression:'uniform',sourceZ:1,exponent:1.4,shellDepth:.03};
 if(film===0&&chapter>=2){r.zMin=1;r.zMax=2.4;r.shape.centreX=.055;r.severity=.9;p.regions=[r];if(chapter===3)p.bearing=0;}
 if(film===1&&chapter>0){p.regions=[r];if(chapter===1){r.decay.progression='source';r.severity=.9;}if(chapter>=2){r.shape.centreX=.07;r.severity=.85;}if(chapter===3)r.kind='void';}
 if(film===2&&chapter>=2||film===3&&chapter>0)p.regions=[r];
 if(film===4){p.material={basis:'user-bending',E:8e9,bending:40e6,source:'Video example assumption: 40 MPa bending, 8 GPa; not test data'};if(chapter>=2){r.kind='void';r.zMin=1;r.zMax=2.4;r.shape.centreX=.055;r.shape.radiusX=.075;r.shape.radiusY=.065;p.regions=[r];}if(chapter===4)p.bearing=0;}
 return p;}
export function filmSectionHeight(film:number,chapter:number,criticalHeight:number){return film===4&&chapter===3?criticalHeight:film===0&&chapter>=2||film===4&&chapter>=2?1.7:1;}
