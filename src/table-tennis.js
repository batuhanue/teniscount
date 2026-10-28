export function createMatch(config){return {config,points:[0,0],games:[0,0],sets:[0,0],results:[],server:config.server??0,winner:null,totalPoints:[0,0],pointCount:0};}
export function serving(s){const n=s.points[0]+s.points[1];const turns=s.points[0]>=10&&s.points[1]>=10?10+(n-20):Math.floor(n/2);return (s.server+turns)%2;}
export function labels(s){return s.points.map(String);}
export function score(state,player){if(state.winner!==null)return state;const s=structuredClone(state),other=1-player;s.points[player]++;s.totalPoints[player]++;s.pointCount++;
if(s.points[player]>=11&&s.points[player]-s.points[other]>=2){s.results.push([...s.points]);s.sets[player]++;s.points=[0,0];s.server=1-s.server;if(s.sets[player]>=Math.ceil(s.config.bestOf/2))s.winner=player;}
return s;}
