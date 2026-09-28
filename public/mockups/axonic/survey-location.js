export const DEMO_SURVEY_LOCATION={latitude:-37.787,longitude:175.2793,label:'Hamilton · demo survey position',demo:true};
export function surveyLocation(record){
  const p=record.asset.surveyLocation;
  return p&&Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180?p:DEMO_SURVEY_LOCATION;
}
export function googleMapUrls(record){
  const p=surveyLocation(record),position=encodeURIComponent(p.latitude+','+p.longitude);
  // Embed HTML supplied by Google Maps Share for the labelled demo position.
  const demoEmbed='https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3153.1297040247246!2d175.2793!3d-37.787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzfCsDQ3JzEzLjIiUyAxNzXCsDE2JzQ1LjUiRQ!5e0!3m2!1sen!2snz!4v1790471794217!5m2!1sen!2snz';
  return {embed:p===DEMO_SURVEY_LOCATION?demoEmbed:'https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s'+position+'!6i18',open:'https://www.google.com/maps/search/?api=1&query='+position};
}
export function monitorSurveyMap(root){
  const frame=root.querySelector('.survey-map'),notice=root.querySelector('.map-unavailable');
  if(!frame||!notice)return;
  const loaded=()=>{
    try{return frame.contentWindow.location.href!=='about:blank';}
    catch{return true; /* A navigated Google frame is cross-origin. */}
  };
  frame.addEventListener('load',()=>{if(loaded())notice.hidden=true;});
  setTimeout(()=>{if(frame.isConnected&&!loaded())notice.hidden=false;},8000);
}
